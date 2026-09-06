import React, { useState } from 'react';
import { Container, Row, Col, Modal, Carousel } from 'react-bootstrap';
import { Github, FileText } from 'lucide-react';
import SectionHeading from './SectionHeading';
import FetchState from './FetchState';
import Reveal from './motion/Reveal';
import Tilt from './motion/Tilt';
import { useCollection } from '../hooks/useCollection';

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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const Projects: React.FC = () => {
  const { data: projects, status } = useCollection<Project>('projects');
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section id="projects" className="section">
      <Container>
        <SectionHeading
          index="02"
          comment="things i have shipped"
          command="ls ~/projects"
          sub="A selection of applications and experiments, mostly built around React, Node and MongoDB."
        />

        <FetchState status={status} count={projects.length} label="projects" />

        <Row>
          {projects.map((project, i) => {
            const stack = project.techStack ?? [];
            return (
              <Col lg={4} md={6} className="mb-4" key={project._id}>
                <Reveal delay={i * 0.08} className="h-100">
                  <Tilt>
                    <article className="pane">
                      <div className="pane__head">
                        <span className="dot" />
                        <span>{slugify(project.title)}/</span>
                        <span className="ms-auto t-faint">{String(i + 1).padStart(2, '0')}</span>
                      </div>

                      {project.image && (
                        <img
                          className="pane__shot"
                          src={project.image}
                          alt={project.title}
                          loading="lazy"
                        />
                      )}

                      <div className="pane__body">
                        <h3 className="pane__title">{project.title}</h3>
                        <p className="pane__desc">{project.description}</p>

                        <div className="mb-3">
                          {stack.slice(0, 4).map((tech) => (
                            <span className="tag" key={tech}>
                              {tech}
                            </span>
                          ))}
                          {stack.length > 4 && (
                            <span className="tag tag--more">+{stack.length - 4}</span>
                          )}
                        </div>

                        <div className="d-flex gap-2 mt-auto">
                          <button
                            type="button"
                            className="btn-term btn-term--sm"
                            onClick={() => setSelected(project)}
                          >
                            <span className="kw">cat</span> README.md
                          </button>
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-term btn-term--sm"
                              aria-label={`${project.title} source on GitHub`}
                            >
                              <Github size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  </Tilt>
                </Reveal>
              </Col>
            );
          })}
        </Row>
      </Container>

      <Modal show={selected !== null} onHide={() => setSelected(null)} size="lg" centered>
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="d-flex align-items-center gap-2">
                <FileText size={15} className="t-green" />
                {slugify(selected.title)}/README.md
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {(selected.screenshots ?? []).length > 0 && (
                <Carousel className="shots-carousel mb-4" interval={null}>
                  {selected.screenshots.map((shot, index) => (
                    <Carousel.Item key={shot}>
                      <img
                        src={shot}
                        alt={`${selected.title} screenshot ${index + 1}`}
                        className="d-block w-100"
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              )}

              <h3 className="mono t-strong mb-3" style={{ fontSize: '1.25rem' }}>
                # {selected.title}
              </h3>

              <h6>## overview</h6>
              <p className="t-dim">{selected.longDescription || selected.description}</p>

              <h6 className="mt-4">## stack</h6>
              <div className="mb-4">
                {(selected.techStack ?? []).map((tech) => (
                  <span className="tag tag--accent" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>

              {selected.githubUrl && (
                <a
                  href={selected.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-term"
                >
                  <Github size={16} />
                  <span className="kw">git</span> clone
                </a>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>
    </section>
  );
};

export default Projects;
