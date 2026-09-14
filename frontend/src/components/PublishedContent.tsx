import { useEffect, useState } from 'react';
export default function PublishedContent({kind}:{kind:string}) {
  const [items,setItems]=useState<Record<string,any>[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{fetch(`/api/content/${kind}`).then(async r=>{if(!r.ok)throw Error('This section is not published yet.');setItems(await r.json());}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[kind]);
  return <section className="section"><div className="container"><h1>{kind[0].toUpperCase()+kind.slice(1)}</h1>{loading&&<p>Loading…</p>}{error&&<p role="status">{error}</p>}{items.map(item=><article key={item.id} id={item.slug} style={{maxWidth:850,margin:'40px auto'}}>{item.title&&<h2>{item.title}</h2>}{item.media_id&&<figure><img src={`/api/media/${item.media_id}`} alt={item.alt} loading="lazy" style={{maxWidth:'100%',maxHeight:700,objectFit:'contain',borderRadius:12}}/>{item.caption&&<figcaption>{item.caption}</figcaption>}</figure>}<div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.9}}>{item.body}</div></article>)}</div></section>;
}
