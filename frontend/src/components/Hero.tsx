import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Github, Linkedin, Mail, ArrowRight } from 'lucide-react';
import InteractiveTerminal from './InteractiveTerminal';
import Tilt from './motion/Tilt';

// ~500KB of three.js, so it loads after the page is interactive and only on
// hardware likely to render it smoothly.
const HeroScene = lazy(() => import('./three/HeroScene'));

const ROLES = [
  'full-stack developer',
  'react + node engineer',
  'hackathon builder',
  'network & security engineer',
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
  const [minimized,setMinimized] = useState(false);
  const [expanded,setExpanded] = useState(false);
  const [terminalSession,setTerminalSession] = useState(0);

  useEffect(() => {
    setShow3d(true);
  }, []);

  return (
    <section
      id="home"
      className="section hero"
      style={{ paddingTop: 'calc(var(--nav-h) + 72px)', borderTop: 0 }}
    >
      <Container>
        <Row className="align-items-center g-5">
          <Col lg={expanded ? 12 : 8}>
            <Tilt max={2} className="terminal-depth">
            <div className="win terminal-window">
              <div className="win__bar">
                <div className="win__dots">
                  <button type="button" className="win__dot win__dot--r window-control" title="Reset terminal output" aria-label="Reset terminal output" onClick={()=>{setTerminalSession(n=>n+1);setMinimized(false);}}>↺</button>
                  <button type="button" className="win__dot win__dot--y window-control" title={minimized?'Restore terminal':'Minimise terminal'} aria-label={minimized?'Restore terminal':'Minimise terminal'} aria-expanded={!minimized} aria-controls="terminal-body" onClick={()=>setMinimized(!minimized)}>−</button>
                  <button type="button" className="win__dot win__dot--g window-control" title={expanded?'Restore terminal size':'Expand terminal'} aria-label={expanded?'Restore terminal size':'Expand terminal'} aria-pressed={expanded} onClick={()=>{setExpanded(!expanded);setMinimized(false);}}>+</button>
                </div>
                <span className="win__title">het@hetshah.xyz: ~/portfolio</span>
                <span className="win__meta">zsh</span>
              </div>

              {minimized && <div className="p-4 mono">Het Shah · terminal minimised <button className="btn-term btn-term--sm ms-2" onClick={()=>setMinimized(false)}>Restore</button></div>}
              <div id="terminal-body" className="win__body term" hidden={minimized}>
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
                  Engineer, builder, and a person beyond the job title. Explore my work
                  and experience — or get to know me through the terminal below.
                </p>

                <div className="term__cmd">ls ./actions</div>
                <InteractiveTerminal key={terminalSession} />
                <div className="term__out d-flex flex-wrap gap-2 mb-4">
                  <a href="/projects" className="btn-term btn-term--primary">
                    <span className="kw">./</span>view-projects
                    <ArrowRight size={15} />
                  </a>
                  <a href="/contact" className="btn-term">
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
            </Tilt>
          </Col>

          {!expanded && <Col lg={4} className="d-flex flex-column align-items-center gap-4">
            <div className="portrait">
              <img src="/Het.jpg" alt="Het Shah" width={250} height={250} />
              <span className="portrait__tag">~/Het.jpg</span>
            </div>
            {show3d && <Suspense fallback={<p className="mono t-dim">Loading network…</p>}><HeroScene /></Suspense>}
          </Col>}
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
