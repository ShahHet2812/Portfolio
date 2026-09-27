import { Hono } from 'hono';
import testimonialRoutes from './testimonials';
import contentRoutes from './content';
import adminRoutes from './admin';
import { cors } from 'hono/cors';
import {
  countRecentContacts,
  insertContact,
  listExperience,
  listHackathons,
  listProjects,
  listTestimonials,
  markContactNotified,
} from './db';
import { sendContactNotification, type MailEnv } from './mail';

export interface Env extends MailEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  MEDIA?: R2Bucket;
  ALLOWED_ORIGINS?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_EMAIL?: string;
  ADMIN_MODERATION_ENABLED?: string;
}

const app = new Hono<{ Bindings: Env }>();

// The owner interface exists only on its dedicated Access-protected hostname.
// The admin router validates Cloudflare's signed identity before serving even
// the application shell, and returns 404 on every other hostname.
app.use('*', async (c, next) => {
  if (new URL(c.req.url).hostname === 'admin.hetshah.me') {
    return adminRoutes.fetch(c.req.raw, c.env);
  }
  await next();
});

app.use('*', async (c, next) => {
  await next();
  // Start with a one-day policy while the new domain settles. This protects
  // against HTTPS downgrade attacks without creating a long-lived lock-in.
  c.header('Strict-Transport-Security', 'max-age=86400');
});

// Keep one canonical hostname. This also prevents the imported `www` DNS
// record from falling through to an origin server that no longer exists.
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === 'www.hetshah.me') {
    url.hostname = 'hetshah.me';
    return c.redirect(url.toString(), 308);
  }
  await next();
});

app.get('/.well-known/security.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body([
    'Contact: mailto:shahhet28122004@gmail.com',
    'Canonical: https://hetshah.me/.well-known/security.txt',
    'Preferred-Languages: en',
    'Expires: 2027-09-27T00:00:00Z',
    '',
  ].join('\n'));
});

// The site and API share an origin, so CORS only matters if something external
// calls the API. Left open unless ALLOWED_ORIGINS is set.
app.use('/api/*', async (c, next) => {
  const configured = (c.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return cors({ origin: configured.length > 0 ? configured : '*' })(c, next);
});

app.get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ ok: true, db: 'connected' });
  } catch (err) {
    console.error('[health] db check failed:', (err as Error).message);
    return c.json({ ok: false, db: 'error' }, 500);
  }
});

/** Wraps a list endpoint so a query failure never leaks internals to the client. */
const listRoute = (name: string, query: (db: D1Database) => Promise<unknown[]>) => async (c: any) => {
  try {
    return c.json(await query(c.env.DB));
  } catch (err) {
    console.error(`[${name}] query failed:`, (err as Error).message);
    return c.json({ error: `Could not load ${name}.` }, 500);
  }
};

app.get('/api/projects', listRoute('projects', listProjects));
app.get('/api/testimonials', listRoute('testimonials', listTestimonials));
app.get('/api/hackathons', listRoute('hackathons', listHackathons));
app.get('/api/experience', listRoute('experience', listExperience));
app.route('/api', contentRoutes);

const xml = (value: string) => value.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
app.get('/feed/:section.xml', async c => {
  const section=c.req.param('section') || '';
  if(!['lab','journal'].includes(section)) return c.notFound();
  const visibility=await c.env.DB.prepare('SELECT enabled FROM site_sections WHERE name=?').bind(section).first<{enabled:number}>();
  if(!visibility?.enabled)return c.notFound();
  const kinds=section==='lab'?['lab']:['journal_post','photo_story'];
  const placeholders=kinds.map(()=>'?').join(',');
  const {results}=await c.env.DB.prepare(`SELECT title,slug,summary,kind,published_at publishedAt FROM content_entries WHERE status='published' AND kind IN (${placeholders}) ORDER BY published_at DESC LIMIT 50`).bind(...kinds).all<any>();
  const items=results.map((r:any)=>{const path=r.kind==='lab'?`/lab/${r.slug}`:r.kind==='photo_story'?`/journal/photos/${r.slug}`:`/journal/posts/${r.slug}`;return `<item><title>${xml(r.title)}</title><link>https://hetshah.me${path}</link><guid>https://hetshah.me${path}</guid><description>${xml(r.summary)}</description><pubDate>${new Date(r.publishedAt).toUTCString()}</pubDate></item>`}).join('');
  c.header('Content-Type','application/rss+xml; charset=utf-8'); return c.body(`<?xml version="1.0"?><rss version="2.0"><channel><title>Het Shah — ${section}</title><link>https://hetshah.me/${section}</link><description>${section==='lab'?'Security and network learning notes':'Essays, notes and photo stories'}</description>${items}</channel></rss>`);
});
app.get('/sitemap.xml', async c => {
  const fixed=['','experience','projects','resume','testimonials','hackathons','contact'];
  let dynamic:string[]=[];
  try { const {results}=await c.env.DB.prepare(`SELECT e.kind,e.slug FROM content_entries e JOIN site_sections s ON s.name=CASE WHEN e.kind='lab' THEN 'lab' ELSE 'journal' END WHERE e.status='published' AND s.enabled=1`).all<any>();
    dynamic=results.map((r:any)=>r.kind==='lab'?`lab/${r.slug}`:r.kind==='photo_story'?`journal/photos/${r.slug}`:r.kind==='journal_post'?`journal/posts/${r.slug}`:r.kind==='interest'?'journal/interests':'journal/now'); } catch {}
  const urls=[...new Set([...fixed,...dynamic])].map(path=>`<url><loc>https://hetshah.me/${xml(path)}</loc></url>`).join('');
  c.header('Content-Type','application/xml; charset=utf-8'); return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// ------------------------------------------------------------------ contact

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 5000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** 24-char hex, matching the id shape used across the rest of the schema. */
const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 24);

app.post('/api/contact/add', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Expected a JSON body.' }, 400);
  }

  const name = asString(body.name);
  const email = asString(body.email);
  const message = asString(body.message);

  if (!name || !email || !message) {
    return c.json({ error: 'Name, email and message are all required.' }, 400);
  }
  if (name.length > MAX_NAME) {
    return c.json({ error: `Name must be ${MAX_NAME} characters or fewer.` }, 400);
  }
  if (email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return c.json({ error: 'That email address does not look valid.' }, 400);
  }
  if (message.length > MAX_MESSAGE) {
    return c.json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` }, 400);
  }

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const now = new Date();

  // Rate limiting lives in the database rather than in memory, since Workers
  // isolates are short-lived and not shared between requests.
  try {
    const since = new Date(now.getTime() - RATE_WINDOW_MS).toISOString();
    if ((await countRecentContacts(c.env.DB, ip, since)) >= RATE_MAX) {
      return c.json(
        { error: 'Too many messages from this address. Please try again in a few minutes.' },
        429
      );
    }
  } catch (err) {
    // A failed check shouldn't block a legitimate message.
    console.error('[contact] rate check failed:', (err as Error).message);
  }

  const id = newId();
  try {
    await insertContact(c.env.DB, {
      id,
      name,
      email,
      message,
      ip,
      createdAt: now.toISOString(),
    });
  } catch (err) {
    console.error('[contact] failed to save submission:', (err as Error).message);
    return c.json({ error: 'Could not save your message. Please try again shortly.' }, 500);
  }

  // Already persisted, so a mail failure must not fail the request.
  const result = await sendContactNotification(c.env, { name, email, message, receivedAt: now });
  if (result.sent) {
    c.executionCtx.waitUntil(
      markContactNotified(c.env.DB, id).catch((err) =>
        console.error('[contact] could not flag as notified:', err.message)
      )
    );
  } else {
    console.warn(`[contact] saved ${id} but no notification sent — ${result.reason}`);
  }

  return c.json({ ok: true }, 201);
});

app.route('/api/reviews', testimonialRoutes);
app.all('/api/*', (c) => c.json({ error: 'Not found.' }, 404));
app.all('/admin*', c => c.notFound());

// Everything else is the React app, served from the static assets binding.
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
