import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Download, ExternalLink } from 'lucide-react';
import SectionHeading from './SectionHeading';

const DRIVE_FILE_ID = '1hwcZIb1ZPdLvgvfogiaJqqCRovTC5MmD';
const DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${DRIVE_FILE_ID}`;
const PREVIEW_URL = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/view`;

const CONTENTS = [
  'education & coursework',
  'internships & experience',
  'selected projects',
  'technical skills',
  'achievements & hackathons',
];

const Resume: React.FC = () => (
  <section id="resume" className="section">
    <Container>
      <SectionHeading index="02" comment="the one-page version" command="cat ~/resume.pdf" />

      <Row>
        <Col lg={9} xl={8}>
          <div className="win">
            <div className="win__bar">
              <div className="win__dots">
                <span className="win__dot win__dot--r" />
                <span className="win__dot win__dot--y" />
                <span className="win__dot win__dot--g" />
              </div>
              <span className="win__title">~/documents</span>
              <span className="win__meta">pdf</span>
            </div>

            <div className="win__body term">
              <div className="term__cmd">ls -lh ~/documents</div>
              <div className="term__out mb-4" style={{ overflowX: 'auto' }}>
                <span className="t-faint">-rw-r--r--&nbsp; 1 het&nbsp; staff&nbsp; </span>
                <span className="t-strong">Het_Shah_Resume.pdf</span>
                <span className="t-faint">&nbsp; updated Jan 2025</span>
              </div>

              <div className="term__cmd">head -n 5 Het_Shah_Resume.pdf</div>
              <div className="term__out mb-4">
                {CONTENTS.map((item) => (
                  <div key={item}>
                    <span className="t-green">→</span> <span className="t-dim">{item}</span>
                  </div>
                ))}
              </div>

              <div className="term__cmd">open Het_Shah_Resume.pdf</div>
              <div className="term__out d-flex flex-wrap gap-2">
                <a
                  href={DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-term btn-term--primary"
                >
                  <Download size={16} />
                  download pdf
                </a>
                <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer" className="btn-term">
                  <ExternalLink size={15} />
                  view in browser
                </a>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  </section>
);

export default Resume;
