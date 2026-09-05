import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Send, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import SectionHeading from './SectionHeading';
import { apiUrl } from '../lib/api';

interface FormData {
  name: string;
  email: string;
  message: string;
}

const EMPTY_FORM: FormData = { name: '', email: '', message: '' };

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [state, setState] = useState<SubmitState>('idle');
  const [feedback, setFeedback] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');

    try {
      await axios.post(apiUrl('contact/add'), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setFormData(EMPTY_FORM);
      setState('sent');
      setFeedback("Message delivered. I'll get back to you soon.");
    } catch (error) {
      const serverMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setState('error');
      setFeedback(
        serverMessage ??
          'Could not send the message. Please try again, or email me directly at work.hetshah28@gmail.com.'
      );
    }
  };

  const sending = state === 'sending';

  return (
    <section id="contact" className="section section--alt">
      <Container>
        <SectionHeading
          index="05"
          comment="say hello"
          command="./contact.sh"
          sub="Open to internships, freelance work and collaborations. Drop a note and it lands straight in my inbox."
        />

        <Row className="g-4">
          <Col lg={7}>
            <div className="win">
              <div className="win__bar">
                <div className="win__dots">
                  <span className="win__dot win__dot--r" />
                  <span className="win__dot win__dot--y" />
                  <span className="win__dot win__dot--g" />
                </div>
                <span className="win__title">contact.sh — new message</span>
              </div>

              <div className="win__body">
                <Form onSubmit={handleSubmit} noValidate>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label htmlFor="contact-name" className="field-label">
                        &gt; name <span className="req">*</span>
                      </Form.Label>
                      <Form.Control
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="your name"
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label htmlFor="contact-email" className="field-label">
                        &gt; email <span className="req">*</span>
                      </Form.Label>
                      <Form.Control
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        maxLength={200}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </Col>
                  </Row>

                  <div className="mb-4">
                    <Form.Label htmlFor="contact-message" className="field-label">
                      &gt; message <span className="req">*</span>
                    </Form.Label>
                    <Form.Control
                      id="contact-message"
                      as="textarea"
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      maxLength={5000}
                      placeholder="what are you building?"
                    />
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <button type="submit" className="btn-term btn-term--primary" disabled={sending}>
                      {sending ? (
                        <>
                          <span className="spinner" />
                          sending…
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span className="kw">./</span>send
                        </>
                      )}
                    </button>
                    <span className="mono t-faint" style={{ fontSize: '0.75rem' }}>
                      {formData.message.length}/5000
                    </span>
                  </div>

                  {(state === 'sent' || state === 'error') && (
                    <div
                      className={`term-alert mt-4 ${state === 'sent' ? 'term-alert--ok' : 'term-alert--err'}`}
                      role="status"
                      aria-live="polite"
                    >
                      {state === 'sent' ? (
                        <Check size={16} className="flex-shrink-0 mt-1" />
                      ) : (
                        <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
                      )}
                      <span>{feedback}</span>
                    </div>
                  )}
                </Form>
              </div>
            </div>
          </Col>

          <Col lg={5}>
            <div className="win h-100">
              <div className="win__bar">
                <div className="win__dots">
                  <span className="win__dot win__dot--r" />
                  <span className="win__dot win__dot--y" />
                  <span className="win__dot win__dot--g" />
                </div>
                <span className="win__title">whois het</span>
              </div>

              <div className="win__body">
                <div className="kv">
                  <span className="kv__k">
                    <Mail size={13} className="me-2" />
                    email
                  </span>
                  <a className="kv__v" href="mailto:work.hetshah28@gmail.com">
                    work.hetshah28@gmail.com
                  </a>
                </div>
                <div className="kv">
                  <span className="kv__k">
                    <Phone size={13} className="me-2" />
                    phone
                  </span>
                  <a className="kv__v" href="tel:+918160641056">
                    +91 81606 41056
                  </a>
                </div>
                <div className="kv">
                  <span className="kv__k">
                    <MapPin size={13} className="me-2" />
                    location
                  </span>
                  <span className="kv__v">Ahmedabad, Gujarat, IN</span>
                </div>

                <div className="rule mb-4" />

                <p className="section-kicker mb-3">// elsewhere</p>
                <div className="d-flex gap-2">
                  <a
                    href="https://github.com/ShahHet2812"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    aria-label="GitHub"
                  >
                    <Github size={18} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/het-shah-7264472b3/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a
                    href="https://x.com/SHAHHet94920284"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    aria-label="X / Twitter"
                  >
                    <Twitter size={18} />
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Contact;
