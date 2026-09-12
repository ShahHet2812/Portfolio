import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env } from './index';

const routes = new Hono<{ Bindings: Env }>();
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const hash = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), b => b.toString(16).padStart(2, '0')).join('');
type Submission = { id: string; name: string; email: string; role: string; company: string; experience: string; relationship: string; message: string; status: string; expires_at: number; photo: ArrayBuffer; photo_type: string };

routes.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('X-Content-Type-Options', 'nosniff');
  await next();
});
routes.post('/submit', bodyLimit({ maxSize: 400_000, onError: c => c.json({ error: 'Submission too large. Choose a smaller photo.' }, 413) }), async c => {
  if (!c.env.RESEND_API_KEY) return c.json({ error: 'Reviews are temporarily unavailable. Please try again later.' }, 503);
  const body = await c.req.parseBody();
  const fields = ['name', 'email', 'role', 'company', 'experience', 'relationship', 'message'] as const;
  const data = Object.fromEntries(fields.map(key => [key, typeof body[key] === 'string' ? body[key].trim() : ''])) as Record<typeof fields[number], string>;
  if (fields.some(key => !data[key] || data[key].length > (key === 'message' || key === 'experience' ? 3000 : 200)) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || body.consent !== 'yes') {
    return c.json({ error: 'Complete all fields, provide a valid email, and agree to publication after review.' }, 400);
  }
  const photo = body.photo;
  if (!(photo instanceof File) || photo.size > 250_000 || photo.size < 12) return c.json({ error: 'Upload a JPG, PNG or WebP portrait under 250 KB.' }, 400);
  const bytes = await photo.arrayBuffer();
  const sig = new Uint8Array(bytes);
  const type = sig[0] === 255 && sig[1] === 216 && sig[2] === 255 ? 'image/jpeg' : [137,80,78,71,13,10,26,10].every((v,i) => sig[i] === v) ? 'image/png' : new TextDecoder().decode(sig.slice(0,4)) === 'RIFF' && new TextDecoder().decode(sig.slice(8,12)) === 'WEBP' ? 'image/webp' : '';
  if (!type) return c.json({ error: 'Only JPG, PNG and WebP images are supported.' }, 400);
  const ip = c.req.header('CF-Connecting-IP') || 'local';
  const now = Date.now();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID() + crypto.randomUUID();
  // Conditional insert keeps concurrent submissions inside the same quota.
  const inserted = await c.env.DB.prepare(`INSERT INTO testimonial_submissions
    (id,name,email,role,company,experience,relationship,message,photo,photo_type,token_hash,expires_at,ip,created_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM testimonial_submissions WHERE ip=? AND created_at>?) < 3`)
    .bind(id,data.name,data.email,data.role,data.company,data.experience,data.relationship,data.message,bytes,type,await hash(token),now + 30*86400000,ip,now,ip,now-86400000).run();
  if (!inserted.meta.changes) return c.json({ error: 'Submission limit reached. Please try again tomorrow.' }, 429);
  // Fixed production origin avoids trusting request headers for approval links.
  const url = `https://hetshah.xyz/api/reviews/review/${token}`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `review-${id}` },
      body: JSON.stringify({ from: c.env.MAIL_FROM || 'Het Shah <noreply@hetshah.xyz>', to: [c.env.NOTIFY_EMAIL || 'shahhet28122004@gmail.com'], subject: `Review testimonial from ${data.name}`, text: `${data.name}\n${data.role} at ${data.company}\n${data.email}\n\nExperience: ${data.experience}\nRelationship: ${data.relationship}\n\n${data.message}\n\nReview photo and approve or reject (expires in 30 days):\n${url}` }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Email provider status ${response.status}`);
    await c.env.DB.prepare('UPDATE testimonial_submissions SET notified=1 WHERE id=?').bind(id).run();
    return c.json({ ok: true, message: 'Thank you! Your testimonial was sent to Het for approval.' }, 201);
  } catch {
    console.error('[reviews] Notification failed for submission', id);
    return c.json({ ok: true, message: 'Your testimonial is saved privately. The review email was delayed; please contact Het if it remains unpublished.' }, 202);
  }
});

routes.get('/photo/:id', async c => {
  const token = c.req.query('token');
  const row = await c.env.DB.prepare(`SELECT photo,photo_type FROM testimonial_submissions WHERE id=? AND (status='approved' OR (token_hash=? AND expires_at>?))`)
    .bind(c.req.param('id'), token ? await hash(token) : '', Date.now()).first<Submission>();
  if (!row) return c.notFound();
  return new Response(row.photo, { headers: { 'Content-Type': row.photo_type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
});

routes.get('/review/:token', async c => {
  const token = c.req.param('token');
  const row = await c.env.DB.prepare('SELECT * FROM testimonial_submissions WHERE token_hash=? AND expires_at>?').bind(await hash(token),Date.now()).first<Submission>();
  if (!row) return c.text('This review link is invalid or expired.', 404);
  c.header('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  const details = [row.name, `${row.role} at ${row.company}`, row.email, `Work experience: ${row.experience}`, `Relationship: ${row.relationship}`, row.message].map(v => `<p>${escape(v)}</p>`).join('');
  return c.html(`<!doctype html><html><meta name="viewport" content="width=device-width"><title>Review testimonial</title><body style="max-width:700px;margin:40px auto;padding:24px;font:17px/1.7 system-ui;background:#0a0e14;color:#e8eef5"><h1>Review testimonial</h1><p>Your email address and this review link are private. Approval publishes the name, role, company, work experience, relationship, photo and message.</p><img width="120" alt="Submitted portrait" src="/api/reviews/photo/${row.id}?token=${token}"><div style="white-space:pre-wrap;overflow-wrap:anywhere">${details}</div>${row.status === 'pending' ? '<form method="post"><button name="decision" value="approved">Approve and publish</button> <button name="decision" value="rejected">Reject</button></form>' : `<p>Already ${escape(row.status)}.</p>`}</body></html>`);
});
routes.post('/review/:token', async c => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.text('Invalid origin.',403);
  const body = await c.req.parseBody();
  if (body.decision !== 'approved' && body.decision !== 'rejected') return c.text('Invalid decision.',400);
  const result = await c.env.DB.prepare("UPDATE testimonial_submissions SET status=? WHERE token_hash=? AND expires_at>? AND status='pending'")
    .bind(body.decision,await hash(c.req.param('token')),Date.now()).run();
  return c.text(result.meta.changes ? `Testimonial ${body.decision}. You can close this page.` : 'Link expired or testimonial already reviewed.');
});
export default routes;
