import { Container } from 'react-bootstrap';
import { personal } from '../content/personal';
import Reveal from './motion/Reveal';

export default function Personal({ page }: { page: 'interests' | 'photos' | 'blog' }) {
  return <>
    {page === 'interests' && <section id="interests" className="section section--alt"><Container><Reveal>
      <p className="section-kicker">// beyond the job title</p><h2 className="section-title">Interests & curiosities</h2>
      <p>{personal.bio}</p><div className="personal-grid">
        {personal.interests.map(item => <article className="win p-4" key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}
      </div>{!personal.interests.length && <p className="t-dim">A little more about life outside work — coming soon.</p>}
    </Reveal></Container></section>}
    {page === 'photos' && <section id="photos" className="section"><Container><Reveal>
      <p className="section-kicker">// moments worth keeping</p><h2 className="section-title">Photo journal</h2>
      <div className="personal-grid">{personal.photos.map(photo => <figure key={photo.src}><a href={photo.src} target="_blank" rel="noreferrer"><img className="journal-photo" src={photo.src} alt={photo.alt} loading="lazy" /></a><figcaption>{photo.caption}</figcaption></figure>)}</div>
      {!personal.photos.length && <p className="t-dim">The first moments are yet to be added.</p>}
    </Reveal></Container></section>}
    {page === 'blog' && <section id="blog" className="section section--alt"><Container><Reveal>
      <p className="section-kicker">// thinking out loud</p><h2 className="section-title">Notes & perspectives</h2>
      {personal.posts.map(post => <details className="win p-4 mb-3" key={post.slug} id={`post-${post.slug}`}><summary><time>{post.date}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span className="t-green">Read this note</span></summary><article>{post.paragraphs.map((p,i) => <p key={i}>{p}</p>)}</article></details>)}
      {!personal.posts.length && <p className="t-dim">No posts published yet. This space is for my own thoughts, in my own words.</p>}
    </Reveal></Container></section>}
  </>;
}
