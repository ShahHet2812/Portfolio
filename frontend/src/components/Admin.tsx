import { useEffect, useState } from 'react';
import { preparePortrait } from '../lib/portrait';
import './Admin.css';
import GooglePhotoPicker from './GooglePhotoPicker';

type Row = Record<string, any>;
async function api(path:string, method='GET', data?:unknown) {
  const response=await fetch(`/api/admin${path}`,{method,credentials:'same-origin',headers:method==='GET'?{}:{'X-Admin-Action':'1',...(data instanceof FormData?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:data instanceof FormData?data:JSON.stringify(data)});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.error || `Request failed (${response.status})`);}
  return response.json();
}
const tabs=['Overview','Messages','Testimonials','Photos','Blog','Interests','Sections','Activity'];
export default function Admin(){
  const [session,setSession]=useState<Row|null>(null),[tab,setTab]=useState(new URLSearchParams(location.search).has('review')?'Testimonials':'Overview');
  const [rows,setRows]=useState<Row[]>([]),[overview,setOverview]=useState<Row>({}),[entry,setEntry]=useState<Row|null>(null);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[search,setSearch]=useState(''),[revisions,setRevisions]=useState<Row[]>([]);
  useEffect(()=>{document.title='Owner dashboard — Het Shah';api('/session').then(setSession).catch(e=>setError(e.message));},[]);
  async function refresh(){
    const path=tab==='Overview'?'/overview':tab==='Messages'?'/messages':tab==='Testimonials'?'/reviews':tab==='Sections'?'/sections':tab==='Activity'?'/audit':'/content';
    const result=await api(path);if(tab==='Overview')setOverview(result);else setRows(result);
  }
  useEffect(()=>{setRows([]);setEntry(null);setSearch('');setRevisions([]);if(session)refresh().catch(e=>setError(e.message));},[tab,session]);
  async function act(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await fn();setNotice('Saved.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function save(status=entry?.status){if(!entry)return;await api(`/content/${entry.id}`,'PUT',{...entry,status});setEntry({...entry,status,revision:entry.revision+1});await refresh();}
  async function upload(file:File){const photo=await preparePortrait(file);const form=new FormData();form.append('photo',photo);const result=await api('/media','POST',form);setEntry(prev=>prev?{...prev,media_id:result.id}:prev);setNotice('Photo imported. Save the entry to attach it.');}
  const contentTab=['Photos','Blog','Interests'].includes(tab);
  const visible=rows.filter(r=>(!contentTab||r.kind===tab.toLowerCase())&&JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  if(!session)return <main className="admin-shell"><h1>Owner dashboard</h1><p role="alert">{error || 'Checking secure session…'}</p><p>Google sign-in and your enrolled second factor are required through Cloudflare Access.</p><a href="https://hetshah.xyz">Public website</a></main>;
  return <div className="admin-layout"><aside><a href="/admin" className="admin-brand">het / control room</a><p>Private workspace</p><nav aria-label="Dashboard">{tabs.map(t=><button key={t} aria-current={tab===t?'page':undefined} onClick={()=>{if(!entry||confirm('Leave this editor? Unsaved changes will be lost.'))setTab(t);}}>{t}</button>)}</nav><small>{session.email}</small><a href="/cdn-cgi/access/logout">Sign out</a><a href="https://hetshah.xyz" target="_blank" rel="noreferrer">Open public site ↗</a></aside>
    <main className="admin-shell"><header><div><small>OWNER CONSOLE</small><h1>{tab}</h1></div><button disabled={busy} onClick={()=>act(refresh)}>Refresh</button></header>
      {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
      <fieldset disabled={busy} className="admin-workspace">
      {tab==='Overview'&&<><div className="admin-stats">{Object.entries(overview).map(([key,value])=><article key={key}><strong>{String(value)}</strong><span>{key}</span></article>)}</div><p>Photos, blog and interests stay hidden until enabled under Sections. Drafts never appear on the public site.</p></>}
      {tab!=='Overview'&&<label>Search this view<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, text, status…"/></label>}
      {tab==='Messages'&&visible.map(r=><article key={r.id}><h2>{r.name} <small>{r.state}</small></h2><p>{r.email} · {new Date(r.created_at).toLocaleString()} · Email {r.notified?'sent':'not confirmed'}</p><p className="admin-prose">{r.message}</p><div className="admin-actions"><a href={`mailto:${encodeURIComponent(r.email)}?subject=Re%3A%20Your%20message%20to%20Het`}>Reply in email ↗</a>{['read','unread','archived','trash'].map(state=><button key={state} onClick={()=>act(async()=>{await api(`/messages/${r.id}`,'PATCH',{state});await refresh();})}>{state==='unread'&&r.state==='trash'?'Restore':state}</button>)}{r.state==='trash'&&<button onClick={()=>{if(confirm('Permanently delete this message? This cannot be undone.'))act(async()=>{await api(`/messages/${r.id}`,'DELETE');await refresh();});}}>Delete permanently</button>}</div></article>)}
      {tab==='Testimonials'&&visible.map(r=><article key={r.id}><img className="admin-avatar" src={r.avatar} alt={`${r.name}'s submitted portrait`}/><h2>{r.name} <small>{r.status}</small></h2><p>{r.role}{r.company&&` at ${r.company}`} · {r.email}</p><p className="admin-prose">{r.experience}</p><p>{r.relationship}</p><blockquote className="admin-prose">{r.message}</blockquote><div className="admin-actions">{['approved','rejected','pending'].map(status=><button key={status} onClick={()=>act(async()=>{await api(`/reviews/${r.id}`,'PATCH',{status,legacy:r.legacy});await refresh();})}>{status==='approved'?'Approve / publish':status==='rejected'?'Reject / unpublish':'Keep pending'}</button>)}</div></article>)}
      {tab==='Sections'&&visible.map(r=><article key={r.name}><h2>{r.name}</h2><p>{r.enabled?'Live: published entries are visible.':'Hidden from navigation and public API.'}</p><button onClick={()=>{if(confirm(`${r.enabled?'Hide':'Enable'} ${r.name} on the public website?`))act(async()=>{await api(`/sections/${r.name}`,'PATCH',{enabled:!r.enabled});await refresh();});}}>{r.enabled?'Hide section':'Enable section'}</button></article>)}
      {contentTab&&<><button onClick={()=>act(async()=>{const {id}=await api('/content','POST',{kind:tab.toLowerCase()});const all=await api('/content');setRows(all);setEntry(all.find((r:Row)=>r.id===id));setRevisions([]);})}>+ New draft</button>
        {entry?<article className="admin-editor"><h2>Edit {tab.toLowerCase()}</h2>{['title','slug','caption','alt','source_url'].map(key=><label key={key}>{({title:'Title (optional for photos)',slug:'URL slug',caption:'Caption (optional)',alt:'Image description for accessibility',source_url:'Original Google link (optional)'} as Row)[key]}<input value={entry[key]} maxLength={key==='source_url'?2000:500} onChange={e=>setEntry({...entry,[key]:e.target.value})}/></label>)}
          <label>{tab==='Photos'?'Story (optional)':'Article / description'}<textarea rows={12} maxLength={100000} value={entry.body} onChange={e=>setEntry({...entry,body:e.target.value})}/></label>
          <label>Display order<input type="number" value={entry.position} onChange={e=>setEntry({...entry,position:Number(e.target.value)})}/></label>
          {entry.media_id&&<><img className="admin-preview" src={`/api/admin/media/${entry.media_id}`} alt={entry.alt || 'Image preview'}/><button onClick={()=>setEntry({...entry,media_id:null})}>Remove image from entry</button></>}
          <label>Upload photo (Google Photos: download the selected image first)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!session.mediaReady} onChange={e=>{const file=e.target.files?.[0];if(file)act(()=>upload(file));e.target.value='';}}/></label>
          <button disabled={!session.mediaReady||!entry.source_url} onClick={()=>act(async()=>{const response=await fetch('/api/admin/import/drive',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Action':'1'},body:JSON.stringify({url:entry.source_url})});if(!response.ok)throw Error((await response.json()).error);const blob=await response.blob();await upload(new File([blob],'google-photo',{type:blob.type}));})}>Import image from Drive link</button>
          {!session.mediaReady&&<p>Photo storage needs the Cloudflare R2 binding. Text editing is available.</p>}
          {session.mediaReady&&<GooglePhotoPicker clientId={session.googleClientId} onPhoto={upload} onError={setError}/>}
          <details><summary>Preview</summary><h2>{entry.title}</h2><p>{entry.caption}</p><div className="admin-prose">{entry.body}</div></details>
          <p>Status: {entry.status} · Revision {entry.revision}</p><div className="admin-actions"><button onClick={()=>act(()=>save('draft'))}>Save draft / unpublish</button><button onClick={()=>{if(confirm('Publish this entry? It becomes visible if its section is enabled.'))act(()=>save('published'));}}>Publish</button><button onClick={()=>act(()=>save('trash'))}>Move to trash</button><button onClick={()=>act(async()=>setRevisions(await api(`/content/${entry.id}/revisions`)))}>Revision history</button><button onClick={()=>{if(confirm('Close editor? Unsaved changes will be lost.'))setEntry(null);}}>Close</button></div>
          {revisions.map(r=><p key={r.id}>{new Date(r.created_at).toLocaleString()} <button onClick={()=>{const old=JSON.parse(r.snapshot);setEntry({...old,revision:entry.revision,status:'draft'});setNotice('Revision loaded into editor. Save draft to restore it.');}}>Load revision</button></p>)}
        </article>:visible.map(r=><article key={r.id}><h2>{r.title||r.caption||'Untitled photo'}</h2><p>{r.status} · /{r.kind}/{r.slug}</p><button onClick={()=>{setEntry(r);setRevisions([]);}}>Edit / restore</button></article>)}</>}
      {tab==='Activity'&&visible.map(r=><article key={r.id}><strong>{r.action}</strong><p>{r.target} · {new Date(r.created_at).toLocaleString()}</p></article>)}
      {tab!=='Overview'&&!entry&&visible.length===0&&<p>No entries in this view.</p>}
      </fieldset>
    </main></div>;
}
