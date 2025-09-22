import React, { useState, useEffect } from "react";
import { Container, Row, Col, Carousel } from "react-bootstrap";
import { Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
}

const Testimonials: React.FC = () => {
    const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>([]);

    useEffect(() => {
        fetch('http://localhost:5000/testimonials')
            .then(response => response.json())
            .then(data => setTestimonialsData(data))
            .catch(error => console.error('Error fetching testimonials:', error));
    }, []);
  return (
    <section
      id="testimonials"
      className="section-padding"
      style={{
        background: "radial-gradient(circle at 10% 20%, #0f0c29, #1a1a2e, #000)",
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
              What People Say
            </h2>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Carousel
              indicators={true}
              controls={true}
              interval={5000}
              className="testimonial-carousel"
            >
              {testimonialsData.map((testimonial) => (
                <Carousel.Item key={testimonial.id}>
                  <div className="testimonial-card mx-auto p-5 text-center glass-dark rounded-4">
                    <Quote size={50} className="neon-text mb-4" />
                    <p className="lead mb-4 text-white fst-italic">
                      "{testimonial.text}"
                    </p>
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="testimonial-avatar mb-3"
                    />
                    <h5 className="fw-bold text-white">{testimonial.name}</h5>
                    <p className="text-white-50 mb-0">
                      {testimonial.role}
                    </p>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      </Container>

      <style>
        {`
          .testimonial-card {
            max-width: 700px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            box-shadow: 0 0 25px rgba(0,230,255,0.3);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
          }
          .testimonial-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 0 40px rgba(255, 78, 205, 0.5);
          }

          .testimonial-avatar {
            width: 90px;
            height: 90px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid rgba(0, 230, 255, 0.7);
            box-shadow: 0 0 20px rgba(0,230,255,0.5);
          }

          .neon-text {
            color: #00e6ff;
            text-shadow: 0 0 12px #00e6ff, 0 0 24px #ff4ecd;
          }

          .testimonial-carousel .carousel-indicators [data-bs-target] {
            background-color: #00e6ff;
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          .testimonial-carousel .carousel-control-prev-icon,
          .testimonial-carousel .carousel-control-next-icon {
            filter: invert(1) drop-shadow(0 0 6px #00e6ff);
          }
        `}
      </style>
    </section>
  );
};

export default Testimonials;