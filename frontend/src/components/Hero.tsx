import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Github, Linkedin, Mail } from "lucide-react";
import profilePic from "/Het.jpg"; // replace with your image

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="d-flex align-items-center text-center min-vh-100 position-relative text-white overflow-hidden p-5"
      style={{
        background: "radial-gradient(circle at 20% 30%, #1a1a2e, #0f0c29, #000)",
      }}
    >
      {/* Decorative Background Particles */}
      {[...Array(25)].map((_, i) => (
        <span
          key={i}
          className="position-absolute rounded-circle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: "rgba(0, 255, 255, 0.7)",
            filter: "blur(1px)",
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Hero Content */}
      <Container style={{ position: "relative", zIndex: 2 }}>
        <Row className="align-items-center">
          {/* Profile Picture */}
          <Col md={4} className="d-flex justify-content-center mb-4 mb-md-0">
            <div
              style={{
                padding: "12px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(0,255,255,0.4), rgba(255,0,255,0.4))",
                backdropFilter: "blur(20px)",
                boxShadow: "0 0 40px rgba(0,255,255,0.5)",
              }}
            >
              <img
                src={profilePic}
                alt="Profile"
                className="rounded-circle"
                style={{
                  width: "260px",
                  height: "260px",
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.2)",
                }}
              />
            </div>
          </Col>

          {/* Text Content */}
          <Col md={8} className="text-md-start text-center">
            <h1
              className="fw-bold display-3 mb-3"
              style={{
                background: "linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Het Shah
            </h1>

            <h2 className="fw-semibold mb-4 text-light">
              Computer Science Student | Full-Stack Developer
            </h2>
            <p
              className="lead mb-4"
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              Turning ideas into reality through modern, elegant, and scalable
              web applications.
              <br /> Building with passion. Designing with purpose.
            </p>

            {/* Buttons */}
            <div className="d-flex gap-3 flex-wrap mb-4 justify-content-center justify-content-md-start">
              <Button
                href="#projects"
                size="lg"
                className="fw-semibold px-4 aesthetic-btn"
              >
                🚀 View My Work
              </Button>
              <Button
                href="#contact"
                size="lg"
                className="fw-semibold px-4 text-dark aesthetic-btn-filled"
              >
                ✉️ Contact Me
              </Button>
            </div>

            {/* Social Links */}
            <div className="d-flex gap-4 fs-3 justify-content-center justify-content-md-start">
              <a
                href="https://github.com/ShahHet2812"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Github size={36} />
              </a>
              <a
                href="https://www.linkedin.com/in/het-shah-7264472b3/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Linkedin size={36} />
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=work.hetshah28@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <Mail size={36} />
              </a>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Styles */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-20px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.8; }
          }

          .aesthetic-btn {
            border: 2px solid transparent;
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
            transition: all 0.3s ease;
          }

          .aesthetic-btn::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 8px;
            padding: 2px;
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            -webkit-mask: 
              linear-gradient(#fff 0 0) content-box, 
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
          }

          .aesthetic-btn:hover {
            text-shadow: 0 0 15px #00e6ff, 0 0 20px #ff4ecd;
          }

          .aesthetic-btn-filled {
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            border: none;
            color: #fff !important;
            box-shadow: 0 0 20px rgba(0,230,255,0.5);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .aesthetic-btn-filled:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 30px rgba(0,230,255,0.7);
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
    </section>
  );
};

export default Hero;

