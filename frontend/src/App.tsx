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

function App() {
  const path = currentPath();
  const content: Record<string, ReactNode> = {
    '/': <Hero />,
    '/experience': <Experience />,
    '/projects': <Projects />,
    '/resume': <Resume />,
    '/testimonials': <Testimonials />,
    '/hackathons': <Hackathons />,
    '/contact': <Contact />,
  };
  const page = pages.find(item => item.path === path);
  useEffect(() => {
    document.title = page ? `${page.label} — Het Shah` : 'Page not found — Het Shah';
  }, [page]);
  return (
    <div className="App">
      <Navigation />
      <main className={path === '/' ? 'home-page' : 'inner-page'}>
        {content[path] || <section className="section"><div className="container"><h1>Page not found</h1><p>That path doesn’t exist here.</p><a className="btn-term" href="/">Return home</a></div></section>}
      </main>
      <Footer />
    </div>
  );
}

export default App;
