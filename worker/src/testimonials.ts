import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env } from './index';

const routes = new Hono<{ Bindings: Env }>();
// Old bearer links can no longer reveal or approve private submissions.
routes.all('/review/:token', c => c.text('Review this submission in https://admin.hetshah.xyz/admin', 410));
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
  const url = `https://admin.hetshah.xyz/admin?review=${id}`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `review-${id}` },
      body: JSON.stringify({ from: c.env.MAIL_FROM || 'Het Shah <noreply@hetshah.xyz>', to: [c.env.NOTIFY_EMAIL || 'shahhet28122004@gmail.com'], subject: `Review testimonial from ${data.name}`, text: `${data.name}\n${data.role} at ${data.company}\n${data.email}\n\nExperience: ${data.experience}\nRelationship: ${data.relationship}\n\n${data.message}\n\nSign in to your owner dashboard to review this submission:\n${url}` }),
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
  const row = await c.env.DB.prepare(`SELECT photo,photo_type FROM testimonial_submissions WHERE id=? AND status='approved'`)
    .bind(c.req.param('id')).first<Submission>();
  if (!row) return c.notFound();
  return new Response(row.photo, { headers: { 'Content-Type': row.photo_type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
});

export default routes;
