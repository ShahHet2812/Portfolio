import { useState } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Menu, X, Terminal } from 'lucide-react';
import { currentPath, pages } from '../lib/pages';

export default function Navigation() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Navbar expand="xxl" expanded={expanded} onToggle={setExpanded} className="nav-shell py-2 is-scrolled">
      <Container>
        <Navbar.Brand href="/" className="nav-brand">
          <Terminal size={17} className="t-green" />
          <span>het<span className="host">@</span>hetshah.xyz<span className="path">:~$</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" aria-label="Toggle navigation" className="nav-toggle">
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </Navbar.Toggle>
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-xxl-center gap-xxl-1">
            {pages.map(page => (
              <Nav.Link key={page.path} href={page.path} aria-current={currentPath() === page.path ? 'page' : undefined}
                className={`nav-tab ${currentPath() === page.path ? 'is-active' : ''}`}>
                {page.label}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
