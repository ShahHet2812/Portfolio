import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env } from './index';
import { requireAdmin, requireAdminMutation, type AdminIdentity } from './admin-auth';

type Vars = { admin: AdminIdentity };
const admin = new Hono<{ Bindings: Env; Variables: Vars }>();
admin.use('*', requireAdmin);
admin.use('*', async (c,next)=>{ c.header('Cache-Control','no-store'); c.header('X-Frame-Options','DENY'); await next(); });
admin.use('/api/*', async (c,next)=> ['GET','HEAD','OPTIONS'].includes(c.req.method) ? next() : requireAdminMutation(c,next));

const string = (v:unknown) => typeof v === 'string' ? v.trim() : '';
const array = (v:unknown) => Array.isArray(v) ? v.map(string).filter(Boolean) : [];
const id = () => crypto.randomUUID();
const reserved = new Set(['certifications','posts','photos','interests','now','admin','api']);
const slugOk = (s:string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && !reserved.has(s);
const webUrl = (value:unknown) => { const text=string(value); if(!text)return null; try { const url=new URL(text); return ['https:','http:'].includes(url.protocol)?url.toString():null; } catch { return null; } };

async function audit(c:any, action:string, resourceType:string, resourceId?:string, details:unknown={}) {
  const actor = c.get('admin') as AdminIdentity;
  await c.env.DB.prepare(`INSERT INTO admin_audit_events(actor_subject,actor_email,action,resource_type,resource_id,details_json)
    VALUES(?,?,?,?,?,?)`).bind(actor.sub,actor.email,action,resourceType,resourceId||null,JSON.stringify(details)).run();
}

admin.get('/api/overview', async c => {
  const rows = await c.env.DB.batch<any>([
    c.env.DB.prepare("SELECT COUNT(*) n FROM contacts LEFT JOIN contact_state cs ON cs.contact_id=contacts.id WHERE COALESCE(cs.state,'unread')='unread'"),
    c.env.DB.prepare("SELECT COUNT(*) n FROM testimonial_submissions WHERE status='pending'"),
    c.env.DB.prepare("SELECT status,COUNT(*) n FROM content_entries GROUP BY status"),
    c.env.DB.prepare('SELECT name,enabled FROM site_sections'),
  ]);
  return c.json({ unreadMessages:rows[0].results[0]?.n||0,pendingTestimonials:rows[1].results[0]?.n||0,
    content:Object.fromEntries(rows[2].results.map((r:any)=>[r.status,r.n])),sections:Object.fromEntries(rows[3].results.map((r:any)=>[r.name,!!r.enabled])),mediaReady:!!c.env.MEDIA });
});

admin.get('/api/messages', async c => {
  const q = `%${string(c.req.query('q'))}%`;
  const {results}=await c.env.DB.prepare(`SELECT c.id,c.name,c.email,c.message,c.notified,c.created_at AS createdAt,
    COALESCE(cs.state,'unread') state FROM contacts c LEFT JOIN contact_state cs ON cs.contact_id=c.id
    WHERE (?='%%' OR c.name LIKE ? OR c.email LIKE ? OR c.message LIKE ?) ORDER BY c.created_at DESC LIMIT 250`).bind(q,q,q,q).all();
  return c.json(results);
});
admin.patch('/api/messages/:id', async c => {
  const body=await c.req.json<any>(); const state=string(body.state);
  if(!['unread','read','archived','trash'].includes(state)) return c.json({error:'Invalid state.'},400);
  await c.env.DB.prepare(`INSERT INTO contact_state(contact_id,state,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(contact_id) DO UPDATE SET state=excluded.state,updated_at=CURRENT_TIMESTAMP`).bind(c.req.param('id'),state).run();
  await audit(c,'message.state','contact',c.req.param('id'),{state}); return c.json({ok:true});
});

admin.get('/api/testimonials', async c => {
  const [submitted,legacy]=await c.env.DB.batch<any>([
    c.env.DB.prepare(`SELECT id,name,email,role,company,experience,relationship,message,status,created_at AS createdAt,'submission' AS source FROM testimonial_submissions ORDER BY created_at DESC LIMIT 250`),
    c.env.DB.prepare(`SELECT t.id,t.name,t.role,t.text AS message,CASE WHEN COALESCE(v.hidden,0)=1 THEN 'rejected' ELSE 'approved' END AS status,'legacy' AS source FROM testimonials t LEFT JOIN legacy_testimonial_visibility v ON v.testimonial_id=t.id ORDER BY t.position,t.name`)
  ]); return c.json([...submitted.results,...legacy.results]);
});
admin.patch('/api/testimonials/:id', async c => {
  const body=await c.req.json<any>(),status=string(body.status);
  if(!['pending','approved','rejected'].includes(status)) return c.json({error:'Invalid status.'},400);
  if(body.source==='legacy') await c.env.DB.prepare(`INSERT INTO legacy_testimonial_visibility(testimonial_id,hidden,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(testimonial_id) DO UPDATE SET hidden=excluded.hidden,updated_at=CURRENT_TIMESTAMP`).bind(c.req.param('id'),status==='approved'?0:1).run();
  else await c.env.DB.prepare('UPDATE testimonial_submissions SET status=? WHERE id=?').bind(status,c.req.param('id')).run();
  await audit(c,'testimonial.moderate','testimonial',c.req.param('id'),{status}); return c.json({ok:true});
});
admin.get('/api/testimonials/:id/photo', async c => {
  const row=await c.env.DB.prepare('SELECT photo,photo_type AS type FROM testimonial_submissions WHERE id=?').bind(c.req.param('id')).first<any>();
  return row?new Response(row.photo,{headers:{'Content-Type':row.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):c.notFound();
});

admin.get('/api/entries', async c => {
  const q=`%${string(c.req.query('q'))}%`;
  const {results}=await c.env.DB.prepare(`SELECT * FROM content_entries WHERE (?='%%' OR title LIKE ? OR summary LIKE ? OR body_markdown LIKE ?)
    ORDER BY updated_at DESC`).bind(q,q,q,q).all(); return c.json(results);
});
admin.post('/api/entries', async c => saveEntry(c));
admin.put('/api/entries/:id', async c => saveEntry(c,c.req.param('id')));

async function saveEntry(c:any, existingId?:string) {
  const body=await c.req.json();
  const kind=string(body.kind), title=string(body.title), slug=kind==='now'?'now':string(body.slug), status=string(body.status||'draft');
  if(!['lab','journal_post','photo_story','interest','now'].includes(kind)||!title||!(kind==='now'||slugOk(slug))||!['draft','published','trash'].includes(status))
    return c.json({error:'Kind, title, safe non-reserved slug and valid state are required.'},400);
  if(string(body.difficulty)&&!['beginner','intermediate','advanced'].includes(string(body.difficulty)))return c.json({error:'Invalid difficulty.'},400);
  if(status==='published' && (!string(body.summary)|| (kind!=='photo_story' && !string(body.bodyMarkdown)))) return c.json({error:'Published content needs a summary and body.'},400);
  if(status==='published' && !existingId && kind==='photo_story')return c.json({error:'Save the photo story as a draft, attach images, then publish it.'},400);
  if(status==='published' && existingId) {
    const invalid=await c.env.DB.prepare("SELECT 1 FROM entry_media WHERE entry_id=? AND TRIM(alt_text)='' LIMIT 1").bind(existingId).first();
    if(invalid)return c.json({error:'Every published image requires alt text.'},400);
    if(kind==='photo_story' && !(await c.env.DB.prepare('SELECT 1 FROM entry_media WHERE entry_id=? LIMIT 1').bind(existingId).first())) return c.json({error:'A published photo story needs at least one image.'},400);
  }
  if(kind==='now') {
    const other=await c.env.DB.prepare("SELECT id FROM content_entries WHERE kind='now' AND status!='trash' AND id!=?").bind(existingId||'').first();
    if(other) return c.json({error:'Only one current Now entry is allowed.'},409);
  }
  const tags=array(body.tags).slice(0,20), tools=array(body.tools).slice(0,30);
  const refs=(Array.isArray(body.references)?body.references:[]).slice(0,30).map((r:any)=>({label:string(r?.label),url:webUrl(r?.url)})).filter((r:any)=>r.label&&r.url);
  if((string(body.repositoryUrl)&&!webUrl(body.repositoryUrl))||(string(body.demoUrl)&&!webUrl(body.demoUrl)))return c.json({error:'Repository and demo links must use HTTP or HTTPS.'},400);
  const entryId=existingId||id();
  if(existingId) {
    const current=await c.env.DB.prepare('SELECT * FROM content_entries WHERE id=?').bind(existingId).first();
    if(!current) return c.notFound();
    if(Number(body.revision)!==current.revision) return c.json({error:'This entry changed in another session.',currentRevision:current.revision},409);
    await c.env.DB.prepare('INSERT OR IGNORE INTO content_revisions(entry_id,revision,snapshot_json) VALUES(?,?,?)').bind(existingId,current.revision,JSON.stringify(current)).run();
    await c.env.DB.prepare(`UPDATE content_entries SET kind=?,title=?,slug=?,summary=?,body_markdown=?,category=?,difficulty=?,tools_json=?,references_json=?,repository_url=?,demo_url=?,status=?,position=?,revision=revision+1,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(kind,title,slug,string(body.summary),string(body.bodyMarkdown),string(body.category)||null,string(body.difficulty)||null,JSON.stringify(tools),JSON.stringify(refs),webUrl(body.repositoryUrl),webUrl(body.demoUrl),status,Number(body.position)||0,status,existingId).run();
  } else {
    await c.env.DB.prepare(`INSERT INTO content_entries(id,kind,title,slug,summary,body_markdown,category,difficulty,tools_json,references_json,repository_url,demo_url,status,position,published_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='published' THEN CURRENT_TIMESTAMP END)`).bind(entryId,kind,title,slug,string(body.summary),string(body.bodyMarkdown),string(body.category)||null,string(body.difficulty)||null,JSON.stringify(tools),JSON.stringify(refs),webUrl(body.repositoryUrl),webUrl(body.demoUrl),status,Number(body.position)||0,status).run();
  }
  await c.env.DB.prepare('DELETE FROM content_tags WHERE entry_id=?').bind(entryId).run();
  if(tags.length) await c.env.DB.batch(tags.map((tag,i)=>c.env.DB.prepare('INSERT INTO content_tags(entry_id,tag,position) VALUES(?,?,?)').bind(entryId,tag,i)));
  await audit(c,existingId?'content.update':'content.create','content',entryId,{kind,status});
  return c.json({ok:true,id:entryId},existingId?200:201);
}

admin.get('/api/entries/:id/revisions', async c => c.json((await c.env.DB.prepare('SELECT id,revision,created_at AS createdAt FROM content_revisions WHERE entry_id=? ORDER BY revision DESC').bind(c.req.param('id')).all()).results));
admin.get('/api/entries/:id/media', async c => c.json((await c.env.DB.prepare(`SELECT m.id,m.content_type AS contentType,m.byte_size AS byteSize,em.position,em.alt_text AS altText,em.caption
  FROM entry_media em JOIN media m ON m.id=em.media_id WHERE em.entry_id=? ORDER BY em.position`).bind(c.req.param('id')).all()).results));
admin.put('/api/entries/:id/media', async c => {
  const items=(await c.req.json<any>()).items;
  if(!Array.isArray(items)||items.length>40||items.some((x:any)=>!string(x.id)||!string(x.altText)))return c.json({error:'Each of up to 40 images requires an id and alt text.'},400);
  await c.env.DB.prepare('DELETE FROM entry_media WHERE entry_id=?').bind(c.req.param('id')).run();
  if(items.length)await c.env.DB.batch(items.map((x:any,i:number)=>c.env.DB.prepare('INSERT INTO entry_media(entry_id,media_id,position,alt_text,caption) VALUES(?,?,?,?,?)').bind(c.req.param('id'),string(x.id),i,string(x.altText),string(x.caption)||null)));
  await audit(c,'content.media-order','content',c.req.param('id'),{count:items.length});return c.json({ok:true});
});
admin.get('/api/sections', async c => c.json((await c.env.DB.prepare('SELECT name,enabled,updated_at AS updatedAt FROM site_sections ORDER BY name').all()).results));
admin.patch('/api/sections/:name', async c => {
  const name=c.req.param('name'); if(!['lab','journal'].includes(name)) return c.notFound();
  const value=Boolean((await c.req.json<any>()).enabled);
  if(value) { const kinds=name==='lab'?["lab"]:["journal_post","photo_story","interest","now"];
    const placeholders=kinds.map(()=>'?').join(','); const found=await c.env.DB.prepare(`SELECT 1 FROM content_entries WHERE status='published' AND kind IN (${placeholders}) LIMIT 1`).bind(...kinds).first();
    if(!found) return c.json({error:'Publish at least one real entry before enabling this section.'},409); }
  await c.env.DB.prepare('UPDATE site_sections SET enabled=?,updated_at=CURRENT_TIMESTAMP WHERE name=?').bind(value?1:0,name).run();
  await audit(c,'section.visibility','section',name,{enabled:value}); return c.json({ok:true});
});

admin.get('/api/certifications', async c => c.json((await c.env.DB.prepare('SELECT * FROM certifications ORDER BY position,name').all()).results));
admin.post('/api/certifications', async c => saveCertification(c));
admin.put('/api/certifications/:id', async c => saveCertification(c,c.req.param('id')));
admin.delete('/api/certifications/:id', async c => { await c.env.DB.prepare('DELETE FROM certifications WHERE id=?').bind(c.req.param('id')).run();await audit(c,'certification.delete','certification',c.req.param('id'));return c.json({ok:true}); });
async function saveCertification(c:any, existing?:string) {
  const b=await c.req.json(), state=string(b.state), certId=existing||id();
  if(!string(b.name)||!string(b.issuer)||!['planned','in_progress','earned'].includes(state)||(string(b.credentialUrl)&&!webUrl(b.credentialUrl))) return c.json({error:'Name, issuer, valid state and a safe credential URL are required.'},400);
  if(existing) { const row=await c.env.DB.prepare('SELECT revision FROM certifications WHERE id=?').bind(existing).first(); if(!row)return c.notFound(); if(row.revision!==Number(b.revision))return c.json({error:'Revision conflict.',currentRevision:row.revision},409);
    await c.env.DB.prepare(`UPDATE certifications SET name=?,issuer=?,state=?,issue_date=?,expiry_date=?,credential_url=?,badge_media_id=?,position=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(string(b.name),string(b.issuer),state,string(b.issueDate)||null,string(b.expiryDate)||null,webUrl(b.credentialUrl),string(b.badgeMediaId)||null,Number(b.position)||0,existing).run();
  } else await c.env.DB.prepare(`INSERT INTO certifications(id,name,issuer,state,issue_date,expiry_date,credential_url,badge_media_id,position) VALUES(?,?,?,?,?,?,?,?,?)`).bind(certId,string(b.name),string(b.issuer),state,string(b.issueDate)||null,string(b.expiryDate)||null,webUrl(b.credentialUrl),string(b.badgeMediaId)||null,Number(b.position)||0).run();
  await audit(c,existing?'certification.update':'certification.create','certification',certId,{state}); return c.json({ok:true,id:certId});
}

admin.get('/api/media', async c => c.json({ready:!!c.env.MEDIA,items:(await c.env.DB.prepare('SELECT id,content_type AS contentType,byte_size AS byteSize,width,height,source_type AS sourceType,created_at AS createdAt FROM media ORDER BY created_at DESC').all()).results}));
admin.post('/api/media', bodyLimit({maxSize:20*1024*1024+100_000,onError:c=>c.json({error:'Image exceeds 20 MB.'},413)}), async c => {
  if(!c.env.MEDIA)return c.json({error:'Private R2 media storage is not configured.'},503);
  const form=await c.req.parseBody(), file=form.file, alt=string(form.alt);
  if(!(file instanceof File)||!alt)return c.json({error:'An image and alt text are required.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer()); const type=sniff(bytes); if(!type)return c.json({error:'Only genuine JPG, PNG or WebP files are accepted.'},400);
  const mediaId=id(), key=`media/${mediaId}`; await c.env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});
  await c.env.DB.prepare('INSERT INTO media(id,object_key,content_type,byte_size) VALUES(?,?,?,?)').bind(mediaId,key,type,bytes.length).run();
  await audit(c,'media.upload','media',mediaId,{bytes:bytes.length}); return c.json({ok:true,id:mediaId},201);
});
admin.post('/api/media/import', async c => {
  if(!c.env.MEDIA)return c.json({error:'Private R2 media storage is not configured.'},503);
  const body=await c.req.json<any>(), sourceUrl=string(body.sourceUrl), token=string(body.accessToken), alt=string(body.alt);
  let sourceType:'drive'|'photos'; let download:string;
  try { const url=new URL(sourceUrl); const drive=/^(drive|docs)\.google\.com$/.test(url.hostname); const photos=url.hostname==='photos.google.com'||url.hostname.endsWith('.googleusercontent.com');
    if(!drive&&!photos)throw new Error(); sourceType=drive?'drive':'photos';
    if(drive){const match=url.pathname.match(/\/d\/([^/]+)/)||[null,url.searchParams.get('id')];if(!match[1])throw new Error();download=`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(match[1])}?alt=media`;}
    else {if(url.hostname==='photos.google.com')throw new Error();download=sourceUrl;}
  } catch {return c.json({error:'Use a Google Drive file URL or a Google Photos Picker media URL.'},400);}
  if(!token||!alt)return c.json({error:'Temporary Google authorization and alt text are required.'},400);
  const response=await fetch(download,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});if(!response.ok)return c.json({error:'Google could not provide that image.'},400);
  const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>20*1024*1024)return c.json({error:'Imported image exceeds 20 MB.'},413);const type=sniff(bytes);if(!type)return c.json({error:'Imported file is not JPG, PNG or WebP.'},400);
  const mediaId=id(),key=`media/${mediaId}`;await c.env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});await c.env.DB.prepare('INSERT INTO media(id,object_key,content_type,byte_size,source_type,source_url) VALUES(?,?,?,?,?,?)').bind(mediaId,key,type,bytes.length,sourceType,sourceUrl).run();
  await audit(c,'media.import','media',mediaId,{sourceType,bytes:bytes.length});return c.json({ok:true,id:mediaId},201);
});
function sniff(b:Uint8Array){ if(b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg'; if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return'image/png'; if(new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')return'image/webp'; return ''; }

admin.get('/api/audit', async c => c.json((await c.env.DB.prepare(`SELECT actor_email AS actorEmail,action,resource_type AS resourceType,resource_id AS resourceId,details_json AS detailsJson,created_at AS createdAt FROM admin_audit_events ORDER BY id DESC LIMIT 500`).all()).results));
admin.all('/api/*', c => c.json({error:'Not found.'},404));
admin.get('*', c => c.env.ASSETS.fetch(c.req.raw));
export default admin;
