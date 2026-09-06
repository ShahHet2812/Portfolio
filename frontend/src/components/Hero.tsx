import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Github, Linkedin, Mail, ArrowRight } from 'lucide-react';

// ~500KB of three.js, so it loads after the page is interactive and only on
// hardware likely to render it smoothly.
const HeroScene = lazy(() => import('./three/HeroScene'));

const ROLES = [
  'full-stack developer',
  'react + node engineer',
  'hackathon builder',
  'cs undergrad @ ahmedabad',
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Types a word out, holds it, deletes it, then moves to the next one. */
const useTypewriter = (words: string[]) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [enabled] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    if (!enabled) return;
    const word = words[index % words.length];

    if (!deleting && text === word) {
      const hold = setTimeout(() => setDeleting(true), 1900);
      return () => clearTimeout(hold);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setIndex((n) => n + 1);
      return;
    }

    const tick = setTimeout(
      () => setText((prev) => (deleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1))),
      deleting ? 40 : 80
    );
    return () => clearTimeout(tick);
  }, [text, deleting, index, words, enabled]);

  return enabled ? text : words[0];
};

const Hero: React.FC = () => {
  const role = useTypewriter(ROLES);
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    const wideEnough = window.innerWidth >= 768;
    const enoughCores = (navigator.hardwareConcurrency ?? 4) >= 4;
    setShow3d(!prefersReducedMotion() && wideEnough && enoughCores);
  }, []);

  return (
    <section
      id="home"
      className="section hero"
      style={{ paddingTop: 'calc(var(--nav-h) + 72px)', borderTop: 0 }}
    >
      {show3d && (
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      )}

      <Container>
        <Row className="align-items-center g-5">
          <Col lg={8}>
            <div className="win">
              <div className="win__bar">
                <div className="win__dots">
                  <span className="win__dot win__dot--r" />
                  <span className="win__dot win__dot--y" />
                  <span className="win__dot win__dot--g" />
                </div>
                <span className="win__title">het@hetshah.xyz: ~/portfolio</span>
                <span className="win__meta">zsh</span>
              </div>

              <div className="win__body term">
                <div className="term__cmd">whoami</div>
                <h1
                  className="term__out mono t-strong mb-3"
                  style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em' }}
                >
                  Het Shah
                </h1>

                <div className="term__cmd">cat role.txt</div>
                <div className="term__out mb-3">
                  <span className="t-cyan">{role}</span>
                  <span className="cursor" />
                </div>

                <div className="term__cmd">./about --brief</div>
                <p className="term__out mb-4" style={{ maxWidth: '58ch' }}>
                  I build modern, scalable web applications end to end — from schema design and API
                  layers through to interfaces people actually enjoy using.
                </p>

                <div className="term__cmd">ls ./actions</div>
                <div className="term__out d-flex flex-wrap gap-2 mb-4">
                  <a href="#projects" className="btn-term btn-term--primary">
                    <span className="kw">./</span>view-projects
                    <ArrowRight size={15} />
                  </a>
                  <a href="#contact" className="btn-term">
                    <span className="kw">./</span>get-in-touch
                  </a>
                </div>

                <div className="term__cmd">cat ./links</div>
                <div className="term__out d-flex gap-2">
                  <a
                    href="https://github.com/ShahHet2812"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    aria-label="GitHub"
                  >
                    <Github size={18} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/het-shah-7264472b3/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a href="mailto:work.hetshah28@gmail.com" className="icon-link" aria-label="Email">
                    <Mail size={18} />
                  </a>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={4} className="d-flex justify-content-center justify-content-lg-end">
            <div className="portrait">
              <img src="/Het.jpg" alt="Het Shah" width={250} height={250} />
              <span className="portrait__tag">~/Het.jpg</span>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
