import { Hono } from 'hono';
import testimonialRoutes from './testimonials';
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
  ALLOWED_ORIGINS?: string;
}

const app = new Hono<{ Bindings: Env }>();

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

// Everything else is the React app, served from the static assets binding.
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
