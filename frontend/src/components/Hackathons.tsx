import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import { Calendar, Users, Trophy, ExternalLink, Github } from "lucide-react";

interface Hackathon {
  id: number;
  title: string;
  date: string;
  duration: string;
  image: string;
  description: string;
  techStack: string[];
  achievement: string;
  teamSize: number;
  gitUrl?: string;
  projectUrl?: string;
  videoUrl?: string;
}

const Hackathons: React.FC = () => {
  const [hackathonsData, setHackathonsData] = useState<Hackathon[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/hackathons`)
      .then((response) => response.json())
      .then((data) => {
        // sort by date (newest first)
        const sortedData = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setHackathonsData(sortedData);
      })
      .catch((error) => console.error("Error fetching hackathons:", error));
  }, []);

  return (
    <section
      id="hackathons"
      className="py-5 text-white"
      style={{
        background: "radial-gradient(circle at 30% 50%, #0f0c29, #000)",
      }}
    >
      <Container>
        <Row>
          <Col className="text-center mb-5">
            <h2
              className="fw-bold display-5"
              style={{
                background: "linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Hackathon Experiences
            </h2>
          </Col>
        </Row>
        <Row>
          {hackathonsData.map((hackathon) => (
            <Col lg={12} className="mb-4" key={hackathon.id}>
              <Card className="hackathon-card overflow-hidden">
                <Row className="g-0">
                  <Col md={4}>
                    <img
                      src={hackathon.image}
                      alt={hackathon.title}
                      className="img-fluid h-100 w-100"
                      style={{ objectFit: "cover" }}
                    />
                  </Col>
                  <Col md={8}>
                    <Card.Body className="h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4
                          className="fw-bold mb-0"
                          style={{
                            background:
                              "linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {hackathon.title}
                        </h4>
                        <Badge className="achievement-badge">
                          <Trophy size={14} className="me-1" />
                          {hackathon.achievement}
                        </Badge>
                      </div>

                      <div className="d-flex flex-wrap gap-3 mb-3 text-white-50">
                        <div className="d-flex align-items-center">
                          <Calendar size={16} className="me-1" />
                          <small>{hackathon.date}</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <Users size={16} className="me-1" />
                          <small>{hackathon.teamSize} team members</small>
                        </div>
                        <div>
                          <small className="fw-semibold">
                            {hackathon.duration}
                          </small>
                        </div>
                      </div>

                      <p className="text-white-50 flex-grow-1 mb-3">
                        {hackathon.description}
                      </p>

                      <div className="mb-3">
                        <h6 className="fw-bold mb-2 text-white">Tech Stack:</h6>
                        <div>
                          {hackathon.techStack.map((tech, index) => (
                            <Badge className="tech-badge" key={index}>
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto">
                        {hackathon.projectUrl && (
                          <a
                            href={hackathon.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-modern btn-sm me-2 mb-2"
                          >
                            <ExternalLink size={14} className="me-1" />
                            View Project
                          </a>
                        )}
                        {hackathon.gitUrl && (
                          <a
                            href={hackathon.gitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-github btn-sm me-2 mb-2"
                          >
                            <Github size={14} className="me-1" />
                            View GitHub Repo
                          </a>
                        )}
                        {hackathon.videoUrl && (
                          <a
                            href={hackathon.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary-modern btn-sm mb-2"
                          >
                            🎥 Watch Demo
                          </a>
                        )}
                      </div>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <style>
        {`
          .hackathon-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(15px);
            box-shadow: 0 0 20px rgba(0, 230, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hackathon-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 0 40px rgba(0, 230, 255, 0.4);
          }

          .achievement-badge {
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            color: #fff;
            border: none;
            padding: 6px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            box-shadow: 0 0 10px rgba(0, 230, 255, 0.6);
          }

          .tech-badge {
            background: rgba(0, 230, 255, 0.15);
            color: #00e6ff;
            border: 1px solid rgba(0, 230, 255, 0.3);
            margin-right: 6px;
            margin-bottom: 6px;
            border-radius: 8px;
            padding: 5px 10px;
            font-size: 0.85rem;
            transition: all 0.3s ease;
          }
          .tech-badge:hover {
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            color: #fff;
            box-shadow: 0 0 12px rgba(0, 230, 255, 0.6);
          }

          .btn-outline-modern {
            border: 2px solid transparent;
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            color: #fff;
            border-radius: 8px;
            padding: 6px 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
          }
          .btn-outline-modern:hover {
            box-shadow: 0 0 12px rgba(0, 230, 255, 0.6);
            transform: translateY(-2px);
          }

          .btn-github {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 6px 16px;
            border-radius: 10px;
            font-weight: 600;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .btn-github:hover {
            background: #333;
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          }

          .btn-primary-modern {
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            border: none;
            color: #fff;
            padding: 6px 16px;
            border-radius: 10px;
            font-weight: 600;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 0 20px rgba(0, 230, 255, 0.4);
          }
          .btn-primary-modern:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(0, 230, 255, 0.6);
          }
        `}
      </style>
    </section>
  );
};

export default Hackathons;
