import { Hono } from 'hono';
import type { Env } from './index';

const routes = new Hono<{ Bindings: Env }>();
const kinds = ['lab','journal_post','photo_story','interest','now'] as const;

function safeJson(value: unknown, fallback: unknown[] = []) {
  try { return typeof value === 'string' ? JSON.parse(value) : fallback; } catch { return fallback; }
}

async function enabled(db: D1Database, section: 'lab'|'journal') {
  return !!(await db.prepare('SELECT 1 FROM site_sections WHERE name=? AND enabled=1').bind(section).first());
}

async function publicEntry(db: D1Database, kind: string, slug: string) {
  const row = await db.prepare(`SELECT id,kind,title,slug,summary,body_markdown AS bodyMarkdown,
    category,difficulty,tools_json AS toolsJson,references_json AS referencesJson,
    repository_url AS repositoryUrl,demo_url AS demoUrl,published_at AS publishedAt
    FROM content_entries WHERE kind=? AND slug=? AND status='published'`).bind(kind,slug).first<any>();
  if (!row) return null;
  const [tags, media] = await Promise.all([
    db.prepare('SELECT tag FROM content_tags WHERE entry_id=? ORDER BY position,tag').bind(row.id).all<{tag:string}>(),
    db.prepare(`SELECT m.id,m.content_type AS contentType,m.width,m.height,em.alt_text AS altText,em.caption
      FROM entry_media em JOIN media m ON m.id=em.media_id WHERE em.entry_id=? ORDER BY em.position,m.id`).bind(row.id).all(),
  ]);
  const words = `${row.summary} ${row.bodyMarkdown}`.trim().split(/\s+/).filter(Boolean).length;
  return { ...row, tools: safeJson(row.toolsJson), references: safeJson(row.referencesJson),
    toolsJson: undefined, referencesJson: undefined, tags: tags.results.map(t=>t.tag),
    media: media.results.map((m:any)=>({...m,url:`/api/media/${m.id}`})), readingMinutes: Math.max(1,Math.ceil(words/220)) };
}

routes.get('/sections', async c => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT s.name,s.enabled,
      EXISTS(SELECT 1 FROM content_entries e WHERE e.status='published' AND
        ((s.name='lab' AND e.kind='lab') OR (s.name='journal' AND e.kind IN ('journal_post','photo_story','interest','now')))) AS hasContent
      FROM site_sections s ORDER BY s.name`).all();
    return c.json(Object.fromEntries(results.map((r:any)=>[r.name,Boolean(r.enabled && r.hasContent)])));
  } catch { return c.json({ lab:false, journal:false }); }
});

routes.get('/content/:kind', async c => {
  const kind = c.req.param('kind') as typeof kinds[number];
  if (!kinds.includes(kind)) return c.notFound();
  const section = kind === 'lab' ? 'lab' : 'journal';
  if (!await enabled(c.env.DB,section)) return c.notFound();
  const { results } = await c.env.DB.prepare(`SELECT id,title,slug,summary,category,difficulty,published_at AS publishedAt
    FROM content_entries WHERE kind=? AND status='published' ORDER BY position,published_at DESC`).bind(kind).all<any>();
  const output = await Promise.all(results.map(row => publicEntry(c.env.DB,kind,row.slug)));
  return c.json(output.filter(Boolean));
});

routes.get('/content/:kind/:slug', async c => {
  const kind = c.req.param('kind') as typeof kinds[number];
  if (!kinds.includes(kind)) return c.notFound();
  if (!await enabled(c.env.DB,kind === 'lab' ? 'lab' : 'journal')) return c.notFound();
  const item = await publicEntry(c.env.DB,kind,c.req.param('slug'));
  return item ? c.json(item) : c.notFound();
});

routes.get('/certifications', async c => {
  if (!await enabled(c.env.DB,'lab')) return c.notFound();
  const { results } = await c.env.DB.prepare(`SELECT c.id,c.name,c.issuer,c.state,c.issue_date AS issueDate,
    c.expiry_date AS expiryDate,c.credential_url AS credentialUrl,
    CASE WHEN c.badge_media_id IS NULL THEN NULL ELSE '/api/media/' || c.badge_media_id END AS badgeUrl
    FROM certifications c ORDER BY c.position,c.issue_date DESC`).all();
  return c.json(results);
});

routes.get('/media/:id', async c => {
  if (!c.env.MEDIA) return c.notFound();
  const row = await c.env.DB.prepare(`SELECT m.object_key AS objectKey,m.content_type AS contentType FROM media m WHERE m.id=? AND (
    EXISTS(SELECT 1 FROM entry_media em JOIN content_entries e ON e.id=em.entry_id JOIN site_sections s ON s.name=CASE WHEN e.kind='lab' THEN 'lab' ELSE 'journal' END WHERE em.media_id=m.id AND e.status='published' AND s.enabled=1)
    OR EXISTS(SELECT 1 FROM certifications c JOIN site_sections s ON s.name='lab' WHERE c.badge_media_id=m.id AND s.enabled=1)) LIMIT 1`).bind(c.req.param('id')).first<any>();
  if (!row) return c.notFound();
  const object = await c.env.MEDIA.get(row.objectKey);
  if (!object) return c.notFound();
  return new Response(object.body,{headers:{'Content-Type':row.contentType,'Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'}});
});

export default routes;
