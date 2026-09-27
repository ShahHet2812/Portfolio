import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, type ReactNode } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Resume from './components/Resume';
import Testimonials from './components/Testimonials';
import Hackathons from './components/Hackathons';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { currentPath, pages } from './lib/pages';
import AdminDashboard from './components/AdminDashboard';
import { Lab, Journal, PhotoStories, Interests, Now, Certifications, EntryPage, NotFound } from './components/ContentPages';

function App() {
  const path = currentPath();
  if (window.location.hostname === 'admin.hetshah.me') return <AdminDashboard />;
  const content: Record<string, ReactNode> = {
    '/': <Hero />,
    '/experience': <Experience />,
    '/projects': <Projects />,
    '/resume': <Resume />,
    '/testimonials': <Testimonials />,
    '/hackathons': <Hackathons />,
    '/contact': <Contact />,
    '/lab': <Lab />,
    '/lab/certifications': <Certifications />,
    '/journal': <Journal />,
    '/journal/photos': <PhotoStories />,
    '/journal/interests': <Interests />,
    '/journal/now': <Now />,
  };
  const labSlug=/^\/lab\/([^/]+)$/.exec(path)?.[1];
  const postSlug=/^\/journal\/posts\/([^/]+)$/.exec(path)?.[1];
  const photoSlug=/^\/journal\/photos\/([^/]+)$/.exec(path)?.[1];
  const dynamic = labSlug&&labSlug!=='certifications'?<EntryPage kind="lab" slug={labSlug}/>:postSlug?<EntryPage kind="journal_post" slug={postSlug}/>:photoSlug?<EntryPage kind="photo_story" slug={photoSlug}/>:null;
  const page = pages.find(item => item.path === path);
  useEffect(() => {
    document.title = page ? `${page.label} — Het Shah` : 'Page not found — Het Shah';
  }, [page]);
  return (
    <div className="App">
      <Navigation />
      <main className={path === '/' ? 'home-page' : 'inner-page'}>
        {content[path] || dynamic || <NotFound />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
