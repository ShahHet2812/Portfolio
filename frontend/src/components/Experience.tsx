import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Building2, MapPin, ExternalLink } from 'lucide-react';
import SectionHeading from './SectionHeading';
import FetchState from './FetchState';
import { useCollection } from '../hooks/useCollection';
import { formatMonth, monthSpan } from '../lib/dates';

interface Experience {
  _id: string;
  role: string;
  company: string;
  companyUrl?: string;
  employmentType: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  summary?: string;
  highlights?: string[];
  skills?: string[];
}

const Experience: React.FC = () => {
  const { data: roles, status } = useCollection<Experience>('experience');

  return (
    <section id="experience" className="section section--alt">
      <Container>
        <SectionHeading
          index="01"
          comment="where i have worked"
          command="systemctl status experience"
          sub="Internships and roles, most recent first."
        />

        <FetchState status={status} count={roles.length} label="roles" />

        <Row>
          <Col xl={10}>
            {roles.map((role) => {
              const current = !role.endDate;
              const duration = monthSpan(role.startDate, role.endDate);

              return (
                <article className={`role ${current ? 'role--current' : ''}`} key={role._id}>
                  <div className="role__head">
                    <span className={`role__led ${current ? 'is-on' : ''}`} aria-hidden="true" />
                    <h3 className="role__title">{role.role}</h3>
                    <span className="role__state">
                      {current ? 'active (running)' : 'exited (completed)'}
                    </span>
                  </div>

                  <div className="role__body">
                    <div className="role__org">
                      <Building2 size={14} className="t-faint" />
                      {role.companyUrl ? (
                        <a href={role.companyUrl} target="_blank" rel="noopener noreferrer">
                          {role.company}
                          <ExternalLink size={12} className="ms-1" />
                        </a>
                      ) : (
                        <span className="t-strong">{role.company}</span>
                      )}
                      <span className="t-faint">·</span>
                      <span>{role.employmentType}</span>
                      {role.location && (
                        <>
                          <span className="t-faint">·</span>
                          <span className="d-inline-flex align-items-center gap-1">
                            <MapPin size={13} className="t-faint" />
                            {role.location}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="role__dates">
                      {formatMonth(role.startDate)} &rarr;{' '}
                      {role.endDate ? formatMonth(role.endDate) : <span className="t-green">present</span>}
                      {duration && <span className="t-faint"> · {duration}</span>}
                    </div>

                    {role.summary && <p className="role__summary">{role.summary}</p>}

                    {(role.highlights ?? []).length > 0 && (
                      <ul className="role__list">
                        {role.highlights?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {(role.skills ?? []).length > 0 && (
                      <div className="mt-3">
                        {role.skills?.map((skill) => (
                          <span className="tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Experience;
