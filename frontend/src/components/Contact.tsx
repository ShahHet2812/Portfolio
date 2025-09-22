import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Send } from "lucide-react";
import axios from 'axios';


interface FormData {
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "danger">(
    "success"
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/contact/add`, formData);
        setAlertVariant("success");
        setAlertMessage("Thank you for your message! I'll get back to you soon.");
        setFormData({ name: "", email: "", message: "" });
    } catch (error) {
        setAlertVariant("danger");
        setAlertMessage(
            "Sorry, there was an error sending your message. Please try again or contact me directly."
        );
    } finally {
        setIsSubmitting(false);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
    }
  };

  return (
    <section
      id="contact"
      className="py-5 text-white"
      style={{
        background: "radial-gradient(circle at 70% 40%, #1a1a2e, #0f0c29, #000)",
      }}
    >
      <Container>
        <Row>
          <Col className="text-center mb-5">
            <h2
              className="fw-bold display-5"
              style={{
                background:
                  "linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Get In Touch
            </h2>
          </Col>
        </Row>

        <Row>
          <Col lg={8} className="mx-auto">
            {showAlert && (
              <Alert
                variant={alertVariant}
                className="mb-4 text-center neon-alert"
              >
                {alertMessage}
              </Alert>
            )}

            <div className="contact-form p-4 rounded-4">
              <div className="text-center mb-4">
                <p className="lead text-white-50">
                  I'm always interested in new opportunities and collaborations.
                  Whether you have a project in mind or just want to say hello,
                  feel free to reach out!
                </p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-white">
                        Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                        className="neon-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-white">
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                        className="neon-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-white">
                    Message
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell me about your project or just say hello..."
                    className="neon-input"
                  />
                </Form.Group>

                <div className="text-center">
                  <Button
                    type="submit"
                    className="btn-primary-modern"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading-animation me-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <div className="text-center">
              <h4 className="fw-bold mb-4 text-white">Let's Connect</h4>
              <div className="d-flex justify-content-center flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center text-white-50">
                  <Mail size={18} className="me-2 neon-text" />
                  <span>work.hetshah28@gmail.com</span>
                </div>
                <div className="d-flex align-items-center text-white-50">
                  <Phone size={18} className="me-2 neon-text" />
                  <span>+91 8160641056</span>
                </div>
                <div className="d-flex align-items-center text-white-50">
                  <MapPin size={18} className="me-2 neon-text" />
                  <span>Ahmedabad,Gujarat.</span>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-4 mt-3">
                <a
                  href="https://github.com/ShahHet2812"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                >
                  <Github size={28} />
                </a>
                <a
                  href="https://www.linkedin.com/in/het-shah-7264472b3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                >
                  <Linkedin size={28} />
                </a>
                <a
                  href="https://x.com/SHAHHet94920284"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                >
                  <Twitter size={28} />
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <style>
        {`
          .contact-form {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            box-shadow: 0 0 25px rgba(0, 230, 255, 0.2);
          }

          .neon-input {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            transition: all 0.3s ease;
          }
          .neon-input:focus {
            border-color: #00e6ff;
            box-shadow: 0 0 10px rgba(0, 230, 255, 0.6);
          }

          .btn-primary-modern {
            background: linear-gradient(90deg, #00e6ff, #ff4ecd);
            border: none;
            color: #fff;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 0 20px rgba(0, 230, 255, 0.4);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .btn-primary-modern:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 35px rgba(0, 230, 255, 0.7);
          }

          .loading-animation {
            width: 16px;
            height: 16px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #00e6ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .neon-alert {
            background: rgba(0, 230, 255, 0.1);
            border: 1px solid rgba(0, 230, 255, 0.4);
            color: #00e6ff;
            box-shadow: 0 0 20px rgba(0, 230, 255, 0.4);
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

export default Contact;