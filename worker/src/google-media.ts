import { Hono } from 'hono';
import type { Env } from './index';

const app = new Hono<{Bindings:Env}>();
// Only Google's explicit download hosts are reachable; never proxy arbitrary URLs.
const allowed = (u:URL) => u.protocol==='https:' && !u.username && !u.password && !u.port &&
  (['drive.google.com','drive.usercontent.google.com'].includes(u.hostname) || u.hostname.endsWith('.googleusercontent.com'));
async function download(url:URL, token?:string) {
  for(let i=0;i<5;i++) {
    if(!allowed(url)) throw Error('Unsupported download host');
    const response=await fetch(url,{redirect:'manual',headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(15000)});
    if([301,302,303,307,308].includes(response.status)) {
      url=new URL(response.headers.get('location') || '',url); continue;
    }
    if(!response.ok || !/^image\/(jpeg|png|webp)(;|$)/.test(response.headers.get('content-type') || '')) throw Error('Make the Drive image accessible, or download and upload it here.');
    if(Number(response.headers.get('content-length'))>20*1024*1024) throw Error('Image exceeds 20 MB');
    const reader=response.body!.getReader();const chunks:Uint8Array[]=[];let total=0;
    while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>20*1024*1024){await reader.cancel();throw Error('Image exceeds 20 MB');}chunks.push(value);}
    const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new Response(bytes,{headers:{'Content-Type':response.headers.get('content-type')!,'Cache-Control':'private, no-store'}});
  }
  throw Error('Too many redirects');
}
app.post('/drive',async c=>{
  try {
    const {url}=await c.req.json();const u=new URL(url);
    if(u.protocol!=='https:' || u.hostname!=='drive.google.com')return c.json({error:'Use a Google Drive file-sharing link. Google Photos links require downloading the selected image first.'},400);
    const id=u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] || u.searchParams.get('id');
    if(!id || !/^[\w-]{10,200}$/.test(id))return c.json({error:'Could not find a Drive file ID.'},400);
    return await download(new URL(`https://drive.google.com/uc?export=download&id=${id}`));
  }catch{return c.json({error:'Could not import this link. Share this individual Drive image for viewing, or download it and use Upload photo. Private Google Photos links cannot be imported directly.'},400);}
});
app.post('/picker',async c=>{
  const {token,action,sessionId,baseUrl}=await c.req.json();
  if(typeof token!=='string'||token.length>4096)return c.json({error:'Sign in to Google Photos first.'},400);
  try {
    if(action==='download'){
      const url=new URL(baseUrl);
      if(!url.hostname.endsWith('.googleusercontent.com')||!allowed(url))return c.json({error:'Unsupported photo URL.'},400);
      return await download(new URL(`${url.href}=w1600-h1600`),token);
    }
    if(action!=='create' && (typeof sessionId!=='string'||!/^[a-zA-Z0-9_-]{1,300}$/.test(sessionId)))return c.json({error:'Invalid selection session.'},400);
    const path=action==='create'?'sessions':action==='status'?`sessions/${sessionId}`:action==='list'?`mediaItems?sessionId=${sessionId}&pageSize=100`:action==='delete'?`sessions/${sessionId}`:'';
    if(!path)return c.json({error:'Invalid picker action.'},400);
    const response=await fetch(`https://photospicker.googleapis.com/v1/${path}`,{method:action==='create'?'POST':action==='delete'?'DELETE':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:action==='create'?JSON.stringify({pickingConfig:{maxItemCount:'1'}}):undefined,signal:AbortSignal.timeout(15000)});
    if(!response.ok)return c.json({error:'Google Photos could not complete this selection. Check Picker API access and reconnect.'},400);
    return c.json(action==='delete'?{ok:true}:await response.json());
  }catch{return c.json({error:'Google Photos request failed. Reconnect and try again.'},400);}
});
export default app;
