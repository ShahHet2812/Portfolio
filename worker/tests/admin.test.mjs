import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
test('authenticated owner workflow and blocked bypasses',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'portfolio-admin-')),sql=new DatabaseSync(':memory:'),originalFetch=globalThis.fetch;
 try{
  await build({entryPoints:['src/index.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'app.mjs')});
  const {default:app}=await import(pathToFileURL(join(dir,'app.mjs')));
  sql.exec(readFileSync('db/schema.sql','utf8'));
  for(const file of ['0001-testimonial-submissions.sql','0002-admin.sql']){const migration=readFileSync(`db/migrations/${file}`,'utf8');sql.exec(migration);sql.exec(migration);}
  function prepare(query){let params=[];const s=sql.prepare(query);return {bind(...v){params=v;return this;},async first(){return s.get(...params)||null;},async all(){return {results:s.all(...params)};},async run(){return {meta:s.run(...params)};}};}
  const db={prepare,async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  const env={DB:db,ASSETS:{fetch:()=>new Response('site')},ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'dashboard',OWNER_SUB:'owner-subject'};
  const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='test-key';
  globalThis.fetch=async()=>Response.json({keys:[jwk]});
  async function sign(email='shahhet28122004@gmail.com',aud='dashboard',sub='owner-subject',exp='5m'){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer('https://test.cloudflareaccess.com').setAudience(aud).setSubject(sub).setIssuedAt().setExpirationTime(exp).sign(privateKey);}
  const token=await sign();
  const admin=(path,method='GET',data,headers={})=>app.request(`https://admin.hetshah.xyz/api/admin${path}`,{method,headers:{'Cf-Access-Jwt-Assertion':token,Origin:'https://admin.hetshah.xyz','X-Admin-Action':'1','Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)},env);
  for(const host of ['hetshah.xyz','portfolio.shahhet28122004.workers.dev'])assert.equal((await app.request(`https://${host}/api/admin/messages`,{},env)).status,404);
  assert.equal((await app.request('https://admin.hetshah.xyz/admin',{},env)).status,403);
  assert.equal((await app.request('https://admin.hetshah.xyz/assets/file.js',{},env)).status,403);
  assert.equal((await admin('/session')).status,200);
  for(const bad of [await sign('other@example.com'),await sign(undefined,'wrong'),await sign(undefined,undefined,'other'),await sign(undefined,undefined,undefined,'-1s'),token+'x'])assert.equal((await admin('/session','GET',undefined,{'Cf-Access-Jwt-Assertion':bad})).status,403);
  assert.equal((await admin('/sections/blog','PATCH',{enabled:true},{Origin:'https://evil.example'})).status,403);
  const {id}=await(await admin('/content','POST',{kind:'blog'})).json();
  let entry={...sql.prepare('SELECT * FROM content_entries WHERE id=?').get(id),title:'Hello',body:'My post',slug:'hello'};
  assert.equal((await admin(`/content/${id}`,'PUT',entry)).status,200);
  assert.equal((await admin(`/content/${id}`,'PUT',entry)).status,409);
  assert.equal((await app.request('/api/content/blog',{},env)).status,404);
  await admin('/sections/blog','PATCH',{enabled:true});assert.deepEqual(await(await app.request('/api/content/blog',{},env)).json(),[]);
  await admin(`/content/${id}`,'PUT',{...entry,revision:2,status:'published'});
  assert.equal((await(await app.request('/api/content/blog',{},env)).json()).length,1);
  await admin('/sections/blog','PATCH',{enabled:false});assert.equal((await app.request('/api/content/blog',{},env)).status,404);
  sql.prepare('INSERT INTO contacts(id,name,email,message,ip,created_at) VALUES (?,?,?,?,?,?)').run('message','Visitor','a@example.com','Hi','local',new Date().toISOString());
  assert.equal((await admin('/messages/message','DELETE')).status,409);
  await admin('/messages/message','PATCH',{state:'trash'});await admin('/messages/message','PATCH',{state:'unread'});
  assert.equal((await(await admin('/messages')).json())[0].state,'unread');
  assert.equal((await admin('/import/drive','POST',{url:'https://127.0.0.1/private'})).status,400);
  assert.ok(sql.prepare('SELECT COUNT(*) AS n FROM admin_audit').get().n>0);
 }finally{globalThis.fetch=originalFetch;sql.close();rmSync(dir,{recursive:true,force:true});}
});
