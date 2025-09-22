import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Modal, Badge, Carousel } from "react-bootstrap";
import { Github } from "lucide-react";

interface Project {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  techStack: string[];
  githubUrl: string;
  screenshots: string[];
}

const Projects: React.FC = () => {
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/projects")
      .then((res) => res.json())
      .then((data) => setProjectsData(data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  const handleShowModal = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  return (
    <section
      id="projects"
      className="py-5 position-relative text-white"
      style={{ background: "radial-gradient(circle at 30% 50%, #1a1a2e, #0f0c29, #000)" }}
    >
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <span
          key={i}
          className="position-absolute rounded-circle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: "rgba(0, 200, 255, 0.6)",
            filter: "blur(1px)",
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          }}
        />
      ))}

      <Container style={{ position: "relative", zIndex: 2 }}>
        <Row className="mb-5">
          <Col className="text-center">
            <h2
              className="fw-bold display-5 mb-3"
              style={{
                background: "linear-gradient(90deg, #7dd3fc, #c084fc, #fca5a5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              My Projects
            </h2>
            <p className="text-white-50">A showcase of my best work and experiments</p>
          </Col>
        </Row>

        <Row>
          {projectsData.map((project) => (
            <Col lg={4} md={6} className="mb-4" key={project._id}>
              <Card
                className="h-100 glass-dark border-0 shadow-lg project-card"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "16px",
                  backdropFilter: "blur(10px)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <Card.Img
                  variant="top"
                  src={project.image}
                  alt={project.title}
                  style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold mb-2" style={{ color: "#7dd3fc" }}>
                    {project.title}
                  </Card.Title>
                  <Card.Text className="flex-grow-1 text-white-50">{project.description}</Card.Text>

                  <div className="mb-3">
                    {project.techStack.slice(0, 3).map((tech, index) => (
                      <Badge key={index} className="skill-badge">
                        {tech}
                      </Badge>
                    ))}
                    {project.techStack.length > 3 && (
                      <Badge className="skill-badge extra">+{project.techStack.length - 3} more</Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="fw-semibold btn-modern mt-auto"
                    style={{
                      background: "linear-gradient(90deg, #7dd3fc, #c084fc)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => handleShowModal(project)}
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        {selectedProject && (
          <>
            <Modal.Header
              closeButton
              className="border-0"
              style={{ background: "rgba(17, 25, 40, 0.85)", color: "#fff", backdropFilter: "blur(12px)" }}
            >
              <Modal.Title
                style={{
                  background: "linear-gradient(90deg, #7dd3fc, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {selectedProject.title}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body
              style={{ background: "rgba(17, 25, 40, 0.85)", color: "#e5e7eb", backdropFilter: "blur(12px)" }}
            >
              {/* Slideshow for screenshots */}
              <Carousel className="mb-4">
                {selectedProject.screenshots.map((screenshot, index) => (
                  <Carousel.Item key={index}>
                    <img
                      src={screenshot}
                      alt={`${selectedProject.title} screenshot ${index + 1}`}
                      className="d-block w-100 rounded"
                    />
                  </Carousel.Item>
                ))}
              </Carousel>

              <h5 className="fw-bold">Description</h5>
              <p className="text-white-50">{selectedProject.longDescription}</p>

              <h5 className="fw-bold mt-4">Tech Stack</h5>
              <div className="mb-4">
                {selectedProject.techStack.map((tech, index) => (
                  <Badge key={index} className="skill-badge">
                    {tech}
                  </Badge>
                ))}
              </div>

              <div className="d-flex gap-3 flex-wrap">
                <Button
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "transparent",
                    border: "2px solid #7dd3fc",
                    color: "#7dd3fc",
                    borderRadius: "8px",
                    padding: "10px 16px",
                  }}
                >
                  <Github size={18} className="me-2" />
                  View Code
                </Button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-15px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.8; }
          }
          .project-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 0 25px rgba(125,211,252,0.3);
          }
          .skill-badge {
            background: rgba(125,211,252,0.2);
            color: #7dd3fc;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 0.8rem;
            margin-right: 6px;
            transition: all 0.3s ease;
            cursor: default;
          }
          .skill-badge.extra {
            background: rgba(192,132,252,0.2);
            color: #c084fc;
          }
          .skill-badge:hover {
            background: rgba(125,211,252,0.35);
            color: #fff;
            box-shadow: 0 0 12px rgba(125,211,252,0.6);
            transform: translateY(-2px);
          }
        `}
      </style>
    </section>
  );
};

export default Projects;