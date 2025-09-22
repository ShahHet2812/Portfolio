import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Resume from './components/Resume';
import Testimonials from './components/Testimonials';
import Hackathons from './components/Hackathons';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    const sr = ScrollReveal({
      origin: 'bottom',
      distance: '50px',
      duration: 800,
      delay: 200,
      reset: true,
    });

    sr.reveal('.scroll-reveal');
  }, []);

  return (
    <div className="App">
      <Navigation />
      <Hero />
      <div className="scroll-reveal">
        <Projects />
      </div>
      <div className="scroll-reveal">
        <Resume />
      </div>
      <div className="scroll-reveal">
        <Testimonials />
      </div>
      <div className="scroll-reveal">
        <Hackathons />
      </div>
      <div className="scroll-reveal">
        <Contact />
      </div>
      <Footer />
    </div>
  );
}

export default App;
