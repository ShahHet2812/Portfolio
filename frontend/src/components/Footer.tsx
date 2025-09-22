import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Heart, Github, Linkedin, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer
      className="d-flex align-items-center justify-content-center text-white py-5 position-relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at 20% 30%, #1a1a2e, #0f0c29, #000)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <span
          key={i}
          className="position-absolute rounded-circle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 5 + 2}px`,
            height: `${Math.random() * 5 + 2}px`,
            background: "rgba(0, 255, 255, 0.6)",
            filter: "blur(1.5px)",
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          }}
        />
      ))}

      <Container style={{ position: "relative", zIndex: 2 }}>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p style={{ color: "rgba(255,255,255,0.75)" }} className="mb-0">
              © {new Date().getFullYear()} Het Shah. All rights reserved.
            </p>
          </Col>

          <Col md={6} className="text-center text-md-end">
            <p style={{ color: "rgba(255,255,255,0.75)" }} className="mb-2">
              Made with{" "}
              <Heart
                size={18}
                className="neon-heart"
                fill="currentColor"
              />{" "}
              and lots of coffee
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-md-end">
              <a
                href="https://github.com/ShahHet2812"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Github size={24} />
              </a>
              <a
                href="https://www.linkedin.com/in/het-shah-7264472b3/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Linkedin size={24} />
              </a>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Twitter size={24} />
              </a>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Styles */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-15px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.7; }
          }

          .neon-heart {
            color: #ff4ecd;
            transition: transform 0.3s ease, color 0.3s ease;
          }
          .neon-heart:hover {
            color: #00e6ff;
            transform: scale(1.3);
          }

          .social-icon {
            color: #00e6ff;
            transition: transform 0.3s ease, color 0.3s ease;
          }
          .social-icon:hover {
            color: #ff4ecd;
            transform: scale(1.2);
          }
        `}
      </style>
    </footer>
  );
};

export default Footer;
