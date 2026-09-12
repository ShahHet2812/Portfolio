import React from 'react';
import { Container, Row, Col, Carousel } from 'react-bootstrap';
import SectionHeading from './SectionHeading';
import Reveal from './motion/Reveal';
import FetchState from './FetchState';
import TestimonialForm from './TestimonialForm';
import { useCollection } from '../hooks/useCollection';

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  avatar: string;
  text: string;
  company?: string;
  experience?: string;
  relationship?: string;
}

const Testimonials: React.FC = () => {
  const { data: testimonials, status } = useCollection<Testimonial>('testimonials');

  return (
    <section id="testimonials" className="section">
      <Container>
        <SectionHeading index="04" comment="what people say" command="cat ~/reviews.md" />

        <FetchState status={status} count={testimonials.length} label="reviews" />

        <Reveal>
          <Row>
            <Col lg={10} xl={9}>
              <Carousel
                className="quote-carousel"
                interval={7000}
                indicators={testimonials.length > 1}
                controls={testimonials.length > 1}
              >
                {testimonials.map((testimonial) => (
                  <Carousel.Item key={testimonial._id}>
                    <div className="win">
                      <div className="win__bar">
                        <div className="win__dots">
                          <span className="win__dot win__dot--r" />
                          <span className="win__dot win__dot--y" />
                          <span className="win__dot win__dot--g" />
                        </div>
                        <span className="win__title">reviews.md</span>
                      </div>

                      <div className="win__body">
                        <blockquote className="cmt mb-0">
                          <div className="cmt__open">/**</div>
                          <div className="cmt__line">&ldquo;{testimonial.text}&rdquo;</div>
                          <div className="cmt__close">&nbsp;*/</div>
                        </blockquote>

                        <figcaption className="cmt__attr">
                          {testimonial.avatar && (
                            <img className="cmt__avatar" src={testimonial.avatar} alt="" loading="lazy" />
                          )}
                          <div>
                            <div className="mono t-strong" style={{ fontSize: '0.9375rem' }}>
                              {testimonial.name}
                            </div>
                            <div className="mono t-faint" style={{ fontSize: '0.8125rem' }}>
                              {testimonial.role}
                              {testimonial.company && ` · ${testimonial.company}`}
                            </div>
                          </div>
                        </figcaption>
                        {testimonial.experience && <p className="mt-3">Work experience: {testimonial.experience}</p>}
                        {testimonial.relationship && <p className="t-dim">{testimonial.relationship}</p>}
                      </div>
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            </Col>
          </Row>
        </Reveal>
        <TestimonialForm />
      </Container>
    </section>
  );
};

export default Testimonials;
