import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { SignJWT, generateKeyPair, exportJWK } from 'jose';

function database(sql){
  const adapt=query=>{let params=[];const statement=sql.prepare(query);return{bind(...v){params=v;return this},async first(){return statement.get(...params)||null},async all(){return{results:statement.all(...params)}},async run(){return{meta:statement.run(...params)}}}};
  return {prepare:adapt,async batch(statements){return Promise.all(statements.map(s=>s.all()))}};
}

test('content remains private by default and admin Access identity fails closed',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'portfolio-admin-')),sqlite=new DatabaseSync(':memory:'),originalFetch=globalThis.fetch;
  try{
    await build({entryPoints:['src/index.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'app.mjs')});
    const{default:app}=await import(pathToFileURL(join(dir,'app.mjs')));
    sqlite.exec(readFileSync('db/schema.sql','utf8'));sqlite.exec(readFileSync('db/migrations/0001-testimonial-submissions.sql','utf8'));const migration=readFileSync('db/migrations/0002-content-admin.sql','utf8');sqlite.exec(migration);sqlite.exec(migration);
    const DB=database(sqlite),base={DB,ASSETS:{fetch:()=>new Response('dashboard')}};
    assert.deepEqual(await(await app.request('https://hetshah.me/api/sections',{},base)).json(),{journal:false,lab:false});
    assert.equal((await app.request('https://hetshah.me/admin',{},base)).status,404);
    assert.equal((await app.request('https://admin.hetshah.me/',{},base)).status,503);

    const{privateKey,publicKey}=await generateKeyPair('RS256'),jwk=await exportJWK(publicKey);jwk.kid='owner';
    globalThis.fetch=async url=>String(url).includes('/cdn-cgi/access/certs')?Response.json({keys:[jwk]}):originalFetch(url);
    const configured={...base,ACCESS_TEAM_DOMAIN:'team.cloudflareaccess.com',ACCESS_AUD:'portfolio-aud',ADMIN_EMAIL:'shahhet28122004@gmail.com'};
    const token=(claims={})=>new SignJWT({email:claims.email||'shahhet28122004@gmail.com'}).setProtectedHeader({alg:'RS256',kid:'owner'}).setSubject('owner-subject').setIssuer(claims.iss||'https://team.cloudflareaccess.com').setAudience(claims.aud||'portfolio-aud').setIssuedAt().setExpirationTime(claims.exp||'1h').sign(privateKey);
    const valid=await token({});
    assert.equal((await app.request('https://admin.hetshah.me/api/overview',{headers:{'Cf-Access-Jwt-Assertion':valid}},configured)).status,200);
    for(const bad of [await token({email:'someone@example.com'}),await token({aud:'wrong'}),await token({iss:'https://wrong.example'}),await token({exp:1})]) assert.equal((await app.request('https://admin.hetshah.me/api/overview',{headers:{'Cf-Access-Jwt-Assertion':bad}},configured)).status,403);
    const wrongOrigin=await app.request('https://admin.hetshah.me/api/sections/lab',{method:'PATCH',headers:{'Cf-Access-Jwt-Assertion':valid,'Content-Type':'application/json','X-Admin-Action':'test','Origin':'https://hetshah.me'},body:'{"enabled":true}'},configured);assert.equal(wrongOrigin.status,403);
    const mutate=(path,body,method='POST')=>app.request(`https://admin.hetshah.me/api/${path}`,{method,headers:{'Cf-Access-Jwt-Assertion':valid,'Content-Type':'application/json','X-Admin-Action':'test','Origin':'https://admin.hetshah.me'},body:JSON.stringify(body)},configured);
    assert.equal((await mutate('entries',{kind:'lab',title:'Bad slug',slug:'certifications',summary:'x',bodyMarkdown:'x',status:'draft'})).status,400);
    assert.equal((await mutate('entries',{kind:'lab',title:'Unsafe URL',slug:'unsafe-url',summary:'x',bodyMarkdown:'[x](javascript:alert(1))',repositoryUrl:'javascript:alert(1)',status:'draft'})).status,400);
    const created=await(await mutate('entries',{kind:'journal_post',title:'Private note',slug:'private-note',summary:'Draft',bodyMarkdown:'Safe',status:'draft'})).json();
    assert.equal((await mutate(`entries/${created.id}`,{kind:'journal_post',title:'Changed',slug:'private-note',summary:'Draft',bodyMarkdown:'Safe',status:'draft',revision:99},'PUT')).status,409);
    const{privateKey:wrongKey}=await generateKeyPair('RS256');const forged=await new SignJWT({email:'shahhet28122004@gmail.com'}).setProtectedHeader({alg:'RS256',kid:'owner'}).setSubject('owner-subject').setIssuer('https://team.cloudflareaccess.com').setAudience('portfolio-aud').setExpirationTime('1h').sign(wrongKey);
    assert.equal((await app.request('https://admin.hetshah.me/api/overview',{headers:{'Cf-Access-Jwt-Assertion':forged}},configured)).status,403);

    sqlite.prepare("INSERT INTO content_entries(id,kind,title,slug,summary,body_markdown,status) VALUES('one','lab','Draft','draft-note','private','secret','draft')").run();
    assert.equal((await app.request('https://hetshah.me/api/content/lab',{},base)).status,404);
    sqlite.prepare("UPDATE content_entries SET status='published' WHERE id='one'").run();sqlite.prepare("UPDATE site_sections SET enabled=1 WHERE name='lab'").run();
    const publicEntry=await(await app.request('https://hetshah.me/api/content/lab/draft-note',{},base)).json();assert.equal(publicEntry.title,'Draft');assert.equal(publicEntry.object_key,undefined);
  }finally{globalThis.fetch=originalFetch;sqlite.close();rmSync(dir,{recursive:true,force:true})}
});
