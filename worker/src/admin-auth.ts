import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Env } from './index';

const keysets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verifyOwner(token: string, env: Env) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.OWNER_SUB) throw new Error('Access not configured');
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN)) throw new Error('Invalid issuer');
  let keys = keysets.get(issuer);
  if (!keys) { keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)); keysets.set(issuer,keys); }
  const { payload } = await jwtVerify(token,keys,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['sub','exp','iat','email']});
  if (payload.email !== 'shahhet28122004@gmail.com' || payload.sub !== env.OWNER_SUB) throw new Error('Not owner');
  return payload;
}

export const adminGuard: MiddlewareHandler<{Bindings:Env}> = async (c,next) => {
  c.header('Cache-Control','private, no-store');
  c.header('Referrer-Policy','no-referrer');
  c.header('X-Content-Type-Options','nosniff');
  c.header('X-Frame-Options','DENY');
  c.header('X-Robots-Tag','noindex, nofollow');
  if (new URL(c.req.url).hostname !== 'admin.hetshah.xyz') return c.json({error:'Not found'},404);
  if (!c.env.ACCESS_AUD || !c.env.ACCESS_TEAM_DOMAIN || !c.env.OWNER_SUB) return c.json({error:'Owner access is not configured yet.'},503);
  try { await verifyOwner(c.req.header('Cf-Access-Jwt-Assertion') || '',c.env); }
  catch { return c.json({error:'Owner authentication required.'},403); }
  if (!['GET','HEAD'].includes(c.req.method)) {
    if (c.req.header('Origin') !== 'https://admin.hetshah.xyz' || c.req.header('X-Admin-Action') !== '1') return c.json({error:'Invalid request origin.'},403);
  }
  await next();
};
