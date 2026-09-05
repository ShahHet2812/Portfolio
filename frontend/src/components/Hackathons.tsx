import React, { useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Calendar, Users, Clock, Trophy, ExternalLink, Github, Play, GitCommit } from 'lucide-react';
import SectionHeading from './SectionHeading';
import FetchState from './FetchState';
import { useCollection } from '../hooks/useCollection';

interface Hackathon {
  _id: string;
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
  const { data, status } = useCollection<Hackathon>('hackathons');

  const hackathons = useMemo(
    () => [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data]
  );

  return (
    <section id="hackathons" className="section section--alt">
      <Container>
        <SectionHeading
          index="05"
          comment="48 hours, no sleep"
          command="git log --oneline ~/hackathons"
          sub="Weekend builds, demo-day scrambles and everything that survived the deploy."
        />

        <FetchState status={status} count={hackathons.length} label="hackathons" />

        {hackathons.length > 0 && (
          <div className="gitlog">
            {hackathons.map((hackathon) => (
              <article className="commit" key={hackathon._id}>
                <div className="pane">
                  <div className="pane__head">
                    <GitCommit size={13} className="t-orange flex-shrink-0" />
                    <span className="commit__hash">{hackathon._id.slice(0, 7)}</span>
                    <span className="ms-auto t-faint">{hackathon.date}</span>
                  </div>

                  <Row className="g-0">
                    {hackathon.image && (
                      <Col md={4}>
                        <img
                          className="commit__thumb"
                          src={hackathon.image}
                          alt={hackathon.title}
                          loading="lazy"
                        />
                      </Col>
                    )}

                    <Col md={hackathon.image ? 8 : 12}>
                      <div className="p-4">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                          <h3 className="commit__title">{hackathon.title}</h3>
                          {hackathon.achievement && (
                            <span className="tag tag--award flex-shrink-0 mb-0">
                              <Trophy size={13} />
                              {hackathon.achievement}
                            </span>
                          )}
                        </div>

                        <div className="commit__meta">
                          <span>
                            <Calendar size={13} />
                            {hackathon.date}
                          </span>
                          <span>
                            <Users size={13} />
                            {hackathon.teamSize} members
                          </span>
                          <span>
                            <Clock size={13} />
                            {hackathon.duration}
                          </span>
                        </div>

                        <p className="t-dim mb-3" style={{ fontSize: '0.9375rem' }}>
                          {hackathon.description}
                        </p>

                        <div className="mb-3">
                          {(hackathon.techStack ?? []).map((tech) => (
                            <span className="tag" key={tech}>
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {hackathon.projectUrl && (
                            <a
                              href={hackathon.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-term btn-term--sm"
                            >
                              <ExternalLink size={14} />
                              live
                            </a>
                          )}
                          {hackathon.gitUrl && (
                            <a
                              href={hackathon.gitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-term btn-term--sm"
                            >
                              <Github size={14} />
                              source
                            </a>
                          )}
                          {hackathon.videoUrl && (
                            <a
                              href={hackathon.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-term btn-term--sm"
                            >
                              <Play size={14} />
                              demo
                            </a>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default Hackathons;
