import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

test('testimonial moderation, privacy, validation and abuse controls', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-reviews-'));
  const originalFetch = globalThis.fetch;
  const sql = new DatabaseSync(':memory:');
  try {
    await build({ entryPoints: ['src/index.ts'], bundle: true, platform: 'node', format: 'esm', outfile: join(dir,'app.mjs') });
    const { default: app } = await import(pathToFileURL(join(dir,'app.mjs')));
    sql.exec(readFileSync('db/schema.sql','utf8'));
    const migration=readFileSync('db/migrations/0001-testimonial-submissions.sql','utf8');
    sql.exec(migration); sql.exec(migration); // additive and safe to repeat
    const adapt = query => {
      let params=[];
      const statement=sql.prepare(query);
      return {
        bind(...values) { params=values.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v);return this; },
        async first() { return statement.get(...params) || null; },
        async all() { return {results:statement.all(...params)}; },
        async run() { return {meta:statement.run(...params)}; },
      };
    };
    const env={DB:{prepare:adapt},RESEND_API_KEY:'local-test-only',ASSETS:{fetch:()=>new Response('site')}};
    const mails=[];
    globalThis.fetch=async (_url,init)=>{mails.push(JSON.parse(init.body));return new Response('{}');};
    const send = async (overrides={}, ip='test') => {
      const form=new FormData();
      for(const [k,v] of Object.entries({name:'<script>alert(1)</script>',email:'visitor@example.com',role:'Engineer',company:'Example',experience:'Three years',relationship:'Colleague',message:'Helpful teammate',consent:'yes',...overrides})) form.set(k,v);
      form.set('photo',new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],'portrait.png',{type:'image/png'}));
      return app.request('/api/reviews/submit',{method:'POST',body:form,headers:{'CF-Connecting-IP':ip}},env);
    };
    assert.equal((await send({email:'bad'})).status,400);
    assert.equal((await send({consent:''})).status,400);
    assert.equal((await send()).status,201);
    const row=sql.prepare('SELECT * FROM testimonial_submissions').get();
    assert.equal(row.status,'pending'); assert.equal(row.notified,1);
    assert.deepEqual(await (await app.request('/api/testimonials',{},env)).json(),[]);
    assert.equal((await app.request(`/api/reviews/photo/${row.id}`,{},env)).status,404);
    const token=mails[0].text.match(/review\/([^\s]+)/)[1];
    assert.notEqual(token,row.token_hash);
    const preview=await app.request(`/api/reviews/review/${token}`,{},env);
    assert.equal(preview.status,200); assert.match(await preview.text(), /&lt;script&gt;/);
    assert.equal(sql.prepare('SELECT status FROM testimonial_submissions').get().status,'pending');
    assert.equal((await app.request(`/api/reviews/photo/${row.id}?token=${token}`,{},env)).status,200);
    const decide=decision=>app.request(`/api/reviews/review/${token}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`decision=${decision}`},env);
    await decide('approved');
    const publicRows=await (await app.request('/api/testimonials',{},env)).json();
    assert.equal(publicRows.length,1); assert.equal(publicRows[0].email,undefined);assert.equal(publicRows[0].token_hash,undefined);
    assert.equal((await app.request(`/api/reviews/photo/${row.id}`,{},env)).status,200);
    await decide('rejected');
    assert.equal(sql.prepare('SELECT status FROM testimonial_submissions').get().status,'approved');
    await send(); await send(); assert.equal((await send()).status,429);
    await send({},'another-ip');
    const rejectToken=mails.at(-1).text.match(/review\/([^\s]+)/)[1];
    await app.request(`/api/reviews/review/${rejectToken}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'decision=rejected'},env);
    assert.equal((await (await app.request('/api/testimonials',{},env)).json()).length,1);
    globalThis.fetch=async()=>new Response('{}',{status:503});
    assert.equal((await send({},'email-failure')).status,202);
    assert.equal(sql.prepare("SELECT status FROM testimonial_submissions WHERE ip='email-failure'").get().status,'pending');
    sql.exec('UPDATE testimonial_submissions SET expires_at=0');
    assert.equal((await app.request(`/api/reviews/review/${token}`,{},env)).status,404);
  } finally { globalThis.fetch=originalFetch; sql.close(); rmSync(dir,{recursive:true,force:true}); }
});
