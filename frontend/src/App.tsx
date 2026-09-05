import 'bootstrap/dist/css/bootstrap.min.css';
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

function App() {
  return (
    <div className="App">
      <Navigation />
      <main>
        <Hero />
        <Experience />
        <Projects />
        <Resume />
        <Testimonials />
        <Hackathons />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
