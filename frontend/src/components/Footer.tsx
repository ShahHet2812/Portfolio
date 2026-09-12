import React from 'react';
import { Container } from 'react-bootstrap';
import { GitBranch, Github, Linkedin, Twitter, ArrowUp } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="statusbar">
    <Container>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex flex-wrap align-items-center gap-4">
          <span className="statusbar__item">
            <GitBranch size={13} />
            main
          </span>
          <span className="statusbar__item t-faint">react · node · mongodb</span>
          <span className="statusbar__item t-faint d-none d-md-inline-flex">UTF-8</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3">
          <span className="t-faint">© {new Date().getFullYear()} Het Shah</span>
          <a href="https://github.com/ShahHet2812" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github size={15} />
          </a>
          <a
            href="https://www.linkedin.com/in/het-shah-7264472b3/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={15} />
          </a>
          <a href="https://x.com/SHAHHet94920284" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
            <Twitter size={15} />
          </a>
          <a href="/" className="statusbar__item">
            <ArrowUp size={13} />
            home
          </a>
        </div>
      </div>
    </Container>
  </footer>
);

export default Footer;
