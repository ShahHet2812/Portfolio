import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env } from './index';
import googleMedia from './google-media';

const app = new Hono<{Bindings:Env}>();
const actor = 'shahhet28122004@gmail.com';
const now = () => new Date().toISOString();
const audit = (db:D1Database,action:string,target:string) => db.prepare('INSERT INTO admin_audit(actor,action,target,created_at) VALUES (?,?,?,?)').bind(actor,action,target,now());
app.use('*',bodyLimit({maxSize:500_000,onError:c=>c.json({error:'Request too large.'},413)}));
app.onError((error,c)=>{console.error('[admin]',error.name);return c.json({error:'Could not complete this operation. Refresh and try again.'},500);});
app.route('/import',googleMedia);
app.get('/session',c=>c.json({email:actor,googleClientId:c.env.GOOGLE_CLIENT_ID || '',mediaReady:!!c.env.MEDIA}));
app.get('/overview',async c=>c.json(await c.env.DB.prepare(`SELECT
  (SELECT COUNT(*) FROM testimonial_submissions WHERE status='pending') AS pending,
  (SELECT COUNT(*) FROM contacts c LEFT JOIN contact_state s ON c.id=s.contact_id WHERE COALESCE(s.state,'unread')='unread') AS unread,
  (SELECT COUNT(*) FROM content_entries WHERE status='draft') AS drafts`).first()));
app.get('/messages',async c=>c.json((await c.env.DB.prepare(`SELECT c.id,c.name,c.email,c.message,c.notified,c.created_at,COALESCE(s.state,'unread') AS state FROM contacts c LEFT JOIN contact_state s ON c.id=s.contact_id ORDER BY c.created_at DESC LIMIT 1000`).all()).results));
app.patch('/messages/:id',async c=>{
  const {state} = await c.req.json();
  if (!['unread','read','archived','trash'].includes(state)) return c.json({error:'Invalid state'},400);
  if (!await c.env.DB.prepare('SELECT id FROM contacts WHERE id=?').bind(c.req.param('id')).first()) return c.notFound();
  await c.env.DB.batch([c.env.DB.prepare('INSERT INTO contact_state(contact_id,state) VALUES (?,?) ON CONFLICT(contact_id) DO UPDATE SET state=excluded.state').bind(c.req.param('id'),state),audit(c.env.DB,`message.${state}`,c.req.param('id'))]);
  return c.json({ok:true});
});
app.delete('/messages/:id',async c=>{
  const id=c.req.param('id');
  if (!await c.env.DB.prepare("SELECT contact_id FROM contact_state WHERE contact_id=? AND state='trash'").bind(id).first()) return c.json({error:'Move the message to trash first.'},409);
  await c.env.DB.batch([c.env.DB.prepare('DELETE FROM contact_state WHERE contact_id=?').bind(id),c.env.DB.prepare('DELETE FROM contacts WHERE id=?').bind(id),audit(c.env.DB,'message.delete',id)]);
  return c.json({ok:true});
});
app.get('/reviews',async c=>{
  const pending=await c.env.DB.prepare('SELECT id,name,email,role,company,experience,relationship,message,status,created_at FROM testimonial_submissions ORDER BY created_at DESC LIMIT 1000').all();
  const legacy=await c.env.DB.prepare("SELECT t.id,t.name,t.role,t.text AS message,t.avatar,CASE WHEN COALESCE(s.hidden,0)=1 THEN 'rejected' ELSE 'approved' END AS status FROM testimonials t LEFT JOIN legacy_review_state s ON t.id=s.testimonial_id").all();
  return c.json([...pending.results.map(r=>({...r,legacy:false,avatar:`/api/admin/reviews/${r.id}/photo`})),...legacy.results.map(r=>({...r,legacy:true}))]);
});
app.get('/reviews/:id/photo',async c=>{
  const row=await c.env.DB.prepare('SELECT photo,photo_type FROM testimonial_submissions WHERE id=?').bind(c.req.param('id')).first<{photo:ArrayBuffer;photo_type:string}>();
  return row ? new Response(row.photo,{headers:{'Content-Type':row.photo_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}) : c.notFound();
});
app.patch('/reviews/:id',async c=>{
  const {status,legacy}=await c.req.json(); const id=c.req.param('id');
  if (!['approved','rejected','pending'].includes(status)) return c.json({error:'Invalid status'},400);
  if (legacy) {
    if (!await c.env.DB.prepare('SELECT id FROM testimonials WHERE id=?').bind(id).first()) return c.notFound();
    await c.env.DB.batch([c.env.DB.prepare('INSERT INTO legacy_review_state(testimonial_id,hidden) VALUES (?,?) ON CONFLICT(testimonial_id) DO UPDATE SET hidden=excluded.hidden').bind(id,status==='approved'?0:1),audit(c.env.DB,`legacy-review.${status}`,id)]);
  } else await c.env.DB.batch([c.env.DB.prepare('UPDATE testimonial_submissions SET status=? WHERE id=?').bind(status,id),audit(c.env.DB,`review.${status}`,id)]);
  return c.json({ok:true});
});
app.get('/sections',async c=>c.json((await c.env.DB.prepare('SELECT * FROM site_sections').all()).results));
app.patch('/sections/:name',async c=>{
  const name=c.req.param('name'); const {enabled}=await c.req.json();
  if (!['photos','blog','interests'].includes(name) || typeof enabled!=='boolean') return c.json({error:'Invalid section'},400);
  await c.env.DB.batch([c.env.DB.prepare('UPDATE site_sections SET enabled=? WHERE name=?').bind(enabled?1:0,name),audit(c.env.DB,`section.${enabled?'publish':'hide'}`,name)]);
  return c.json({ok:true});
});
app.get('/content',async c=>c.json((await c.env.DB.prepare('SELECT * FROM content_entries ORDER BY position,updated_at DESC').all()).results));
app.post('/content',async c=>{
  const d=await c.req.json(); const id=crypto.randomUUID();
  if (!['photos','blog','interests'].includes(d.kind)) return c.json({error:'Invalid content type'},400);
  await c.env.DB.batch([c.env.DB.prepare('INSERT INTO content_entries(id,kind,slug,created_at,updated_at) VALUES (?,?,?,?,?)').bind(id,d.kind,id,now(),now()),audit(c.env.DB,'content.create',id)]);
  return c.json({id},201);
});
app.put('/content/:id',async c=>{
  const d=await c.req.json(); const id=c.req.param('id');
  const prev=await c.env.DB.prepare('SELECT * FROM content_entries WHERE id=?').bind(id).first();
  if (!prev) return c.notFound();
  if (d.revision!==prev.revision) return c.json({error:'This entry changed in another tab. Reload before saving.'},409);
  for (const key of ['title','slug','body','caption','alt','source_url']) if(typeof d[key]!=='string' || d[key].length>(key==='body'?100000:key==='source_url'?2000:500)) return c.json({error:`Invalid ${key}`},400);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug) || !['draft','published','trash'].includes(d.status) || !Number.isInteger(d.position) || Math.abs(d.position)>100000) return c.json({error:'Check slug, status and display order.'},400);
  if (d.source_url) { try { const u=new URL(d.source_url); if(u.protocol!=='https:')throw Error(); }catch{return c.json({error:'Source link must use HTTPS.'},400);} }
  if (d.media_id && !await c.env.DB.prepare('SELECT id FROM media WHERE id=?').bind(d.media_id).first()) return c.json({error:'Photo not found.'},400);
  if (d.status==='published' && (prev.kind==='photos' ? !d.media_id || !d.alt.trim() : !d.title.trim() || !d.body.trim())) return c.json({error:'Photos need an image and accessibility description; other published entries need a title and text.'},400);
  if (await c.env.DB.prepare('SELECT id FROM content_entries WHERE slug=? AND id<>?').bind(d.slug,id).first()) return c.json({error:'That URL slug is already used.'},409);
  const updated=await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO content_revisions(entry_id,snapshot,created_at) SELECT id,?,? FROM content_entries WHERE id=? AND revision=?').bind(JSON.stringify(prev),now(),id,d.revision),
    c.env.DB.prepare('UPDATE content_entries SET title=?,slug=?,body=?,caption=?,alt=?,source_url=?,media_id=?,status=?,position=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(d.title,d.slug,d.body,d.caption,d.alt,d.source_url,d.media_id||null,d.status,d.position,now(),id,d.revision),
    audit(c.env.DB,`content.${d.status}`,id),
  ]);
  return updated[1].meta.changes ? c.json({ok:true}) : c.json({error:'Entry changed. Reload.'},409);
});
app.get('/content/:id/revisions',async c=>c.json((await c.env.DB.prepare('SELECT id,snapshot,created_at FROM content_revisions WHERE entry_id=? ORDER BY id DESC LIMIT 50').bind(c.req.param('id')).all()).results));
app.get('/audit',async c=>c.json((await c.env.DB.prepare('SELECT * FROM admin_audit ORDER BY id DESC LIMIT 200').all()).results));
app.post('/media',async c=>{
  if(!c.env.MEDIA) return c.json({error:'Cloudflare R2 is not connected yet.'},503);
  const form=await c.req.parseBody();const file=form.photo;
  if(!(file instanceof File) || file.size>250000) return c.json({error:'Choose a prepared image under 250 KB.'},400);
  const bytes=await file.arrayBuffer(); const sig=new Uint8Array(bytes);
  if(sig[0]!==255 || sig[1]!==216 || sig[2]!==255) return c.json({error:'Expected a prepared JPEG photo.'},400);
  const id=crypto.randomUUID(),key=`photos/${id}.jpg`;
  await c.env.MEDIA.put(key,bytes,{httpMetadata:{contentType:'image/jpeg'}});
  try { await c.env.DB.batch([c.env.DB.prepare('INSERT INTO media VALUES (?,?,?,?,?)').bind(id,key,'image/jpeg',file.size,now()),audit(c.env.DB,'media.import',id)]); }
  catch(error){await c.env.MEDIA.delete(key);throw error;}
  return c.json({id,url:`/api/admin/media/${id}`},201);
});
app.get('/media/:id',async c=>{
  const row=await c.env.DB.prepare('SELECT object_key FROM media WHERE id=?').bind(c.req.param('id')).first<{object_key:string}>();
  const object=row&&c.env.MEDIA?await c.env.MEDIA.get(row.object_key):null;
  return object?new Response(object.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store'}}):c.notFound();
});
export default app;
