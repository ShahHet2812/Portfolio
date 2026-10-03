import { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Menu, X, Terminal } from 'lucide-react';
import { currentPath, pages } from '../lib/pages';
import { useSections } from '../hooks/useSections';

export default function Navigation() {
  const [expanded, setExpanded] = useState(false);
  const sections = useSections();
  const visible = pages.filter(p => !p.section || sections[p.section as keyof typeof sections]);
  const primary = visible.filter(p => !p.more);
  const more = visible.filter(p => p.more);
  return (
    <Navbar expand="xxl" expanded={expanded} onToggle={setExpanded} className="nav-shell py-2 is-scrolled">
      <Container>
        <Navbar.Brand href="/" className="nav-brand">
          <Terminal size={17} className="t-green" />
          <span>het<span className="host">@</span>hetshah.me<span className="path">:~$</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" aria-label="Toggle navigation" className="nav-toggle">
          {expanded ? <X size={20} /> : <Menu size={20} />}
        </Navbar.Toggle>
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-xxl-center gap-xxl-1">
            {primary.map(page => (
              <Nav.Link key={page.path} href={page.path} aria-current={currentPath() === page.path ? 'page' : undefined}
                className={`nav-tab ${currentPath() === page.path ? 'is-active' : ''}`}>
                {page.label}
              </Nav.Link>
            ))}
            <NavDropdown title="More" id="more-navigation" className="nav-more"
              active={more.some(page => currentPath() === page.path)}>
              {more.map(page=><NavDropdown.Item key={page.path} href={page.path}>{page.label}</NavDropdown.Item>)}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
