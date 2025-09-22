import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = () => setExpanded(false);

  return (
    <Navbar
      expand="lg"
      fixed="top"
      expanded={expanded}
      className={`navbar-custom position-fixed w-100 py-3 ${scrolled ? 'scrolled' : ''}`}
      style={{
        background: scrolled
          ? 'rgba(10, 10, 30, 0.85)'
          : 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(15px)',
        transition: 'all 0.3s ease',
        zIndex: 999,
      }}
    >
      <Container>
        <Navbar.Brand
          href="#home"
          className="fw-bold"
          style={{
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Het Shah
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="navbar-nav"
          onClick={() => setExpanded(!expanded)}
          className="border-0"
        >
          {expanded ? <X size={26} color="#00e6ff" /> : <Menu size={26} color="#00e6ff" />}
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-4">
            {['projects', 'resume', 'testimonials', 'hackathons', 'contact'].map((section) => (
              <Nav.Link
                key={section}
                href={`#${section}`}
                onClick={handleNavClick}
                style={{
                  color: '#00e6ff',
                  fontWeight: 500,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style as any).color = '#ff4ecd';
                  (e.currentTarget.style as any).textShadow = '0 0 10px #00e6ff, 0 0 15px #ff4ecd';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style as any).color = '#00e6ff';
                  (e.currentTarget.style as any).textShadow = 'none';
                }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style>
        {`
          .navbar-custom .nav-link.active {
            color: #ffaa00 !important;
            text-shadow: 0 0 15px #ffaa00, 0 0 25px #ff4ecd;
          }
        `}
      </style>
    </Navbar>
  );
};

export default Navigation;