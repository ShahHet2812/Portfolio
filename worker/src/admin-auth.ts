import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Context, Next } from 'hono';
import type { Env } from './index';

export type AdminIdentity = JWTPayload & { email: string; sub: string };
type AppContext = Context<{ Bindings: Env; Variables: { admin: AdminIdentity } }>;

const cookieValue = (cookie: string, name: string) => cookie.split(';').map(v => v.trim())
  .find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);

export async function requireAdmin(c: AppContext, next: Next) {
  const host = new URL(c.req.url).hostname;
  if (host !== 'admin.hetshah.me') return c.notFound();

  const team = c.env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = c.env.ACCESS_AUD;
  const ownerEmail = (c.env.ADMIN_EMAIL || 'shahhet28122004@gmail.com').toLowerCase();
  if (!team || !audience) return c.json({ error: 'Owner access is not configured.' }, 503);

  const token = c.req.header('Cf-Access-Jwt-Assertion') ||
    cookieValue(c.req.header('Cookie') || '', 'CF_Authorization');
  if (!token) return c.json({ error: 'Owner authentication required.' }, 401);

  try {
    const issuer = `https://${team}`;
    const { payload } = await jwtVerify(token, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)), {
      issuer,
      audience,
      algorithms: ['RS256'],
    });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (!payload.sub || email !== ownerEmail) throw new Error('Wrong owner identity');
    c.set('admin', { ...payload, email, sub: payload.sub } as AdminIdentity);
    await next();
  } catch (error) {
    console.warn('[admin] Access token rejected:', (error as Error).message);
    return c.json({ error: 'Owner authentication failed.' }, 403);
  }
}

export async function requireAdminMutation(c: AppContext, next: Next) {
  const origin = c.req.header('Origin');
  const action = c.req.header('X-Admin-Action');
  if (origin !== 'https://admin.hetshah.me' || !action || action.length > 100) {
    return c.json({ error: 'Invalid admin request.' }, 403);
  }
  await next();
}
