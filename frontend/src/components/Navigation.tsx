import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Menu, X, Terminal } from 'lucide-react';

const SECTIONS = [
  { id: 'experience', name: 'experience', ext: '.service' },
  { id: 'projects', name: 'projects', ext: '.tsx' },
  { id: 'resume', name: 'resume', ext: '.pdf' },
  { id: 'testimonials', name: 'reviews', ext: '.md' },
  { id: 'hackathons', name: 'hackathons', ext: '.log' },
  { id: 'contact', name: 'contact', ext: '.sh' },
];

const NAV_HEIGHT = 60;

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const topmost = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (topmost) setActive(topmost.target.id);
      },
      { rootMargin: `-${NAV_HEIGHT}px 0px -55% 0px` }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Navbar
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className={`nav-shell py-2 ${scrolled ? 'is-scrolled' : ''}`}
    >
      <Container>
        <Navbar.Brand href="#home" className="nav-brand" onClick={() => setExpanded(false)}>
          <Terminal size={17} className="t-green" />
          <span>
            het<span className="host">@</span>hetshah.xyz
            <span className="path">:~$</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" aria-label="Toggle navigation" className="nav-toggle">
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-lg-center gap-lg-1">
            {SECTIONS.map((section) => (
              <Nav.Link
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setExpanded(false)}
                className={`nav-tab ${active === section.id ? 'is-active' : ''}`}
              >
                {section.name}
                <span className="ext">{section.ext}</span>
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
