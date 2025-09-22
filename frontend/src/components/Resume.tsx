import React, { useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Download, FileText } from "lucide-react";

const Resume: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Replace with your direct download link
  const resumeUrl =
    "https://drive.google.com/file/d/1hwcZIb1ZPdLvgvfogiaJqqCRovTC5MmD/view?usp=drive_link";

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const link = document.createElement("a");
      link.href = resumeUrl;
      link.download = "Het_Shah_Resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  return (
    <section
      id="resume"
      className="section-padding"
      style={{
        background: "radial-gradient(circle at 80% 20%, #0f0c29, #1a1a2e, #000)",
      }}
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8}>
            <div className="resume-card glass-dark p-5 rounded-4">
              <FileText size={100} className="mb-4 neon-text" />
              <h2
                className="fw-bold display-5 mb-4"
                style={{
                  background:
                    "linear-gradient(90deg, #00e6ff, #ff4ecd, #ffaa00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                }}
              >
                Download My Resume
              </h2>

              <p
                className="lead mb-5"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "1.15rem",
                  lineHeight: "1.8",
                  textShadow: "0 0 8px rgba(0, 230, 255, 0.2)",
                }}
              >
                A complete overview of my{" "}
                <span
                  style={{
                    color: "#00e6ff",
                    textShadow: "0 0 6px rgba(0,230,255,0.8)",
                    fontWeight: 600,
                  }}
                >
                  skills
                </span>
                ,{" "}
                <span
                  style={{
                    color: "#ff4ecd",
                    textShadow: "0 0 6px rgba(255,78,205,0.8)",
                    fontWeight: 600,
                  }}
                >
                  experience
                </span>{" "}
                and{" "}
                <span
                  style={{
                    color: "#ffaa00",
                    textShadow: "0 0 6px rgba(255,170,0,0.8)",
                    fontWeight: 600,
                  }}
                >
                  achievements
                </span>
                . Includes education, projects, internships, and technical expertise.
              </p>


              <Button
                className="btn-primary-modern btn-modern px-4 py-2 fs-5"
                size="lg"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="loading-animation me-2"></span>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={22} className="me-2" />
                    Download Resume
                  </>
                )}
              </Button>

              <div className="mt-4">
                <small className="text-white-50">
                  📄 PDF Format • Last Updated: <span className="text-white">January 2025</span>
                </small>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <style>
        {`
          .resume-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            box-shadow: 0 0 30px rgba(0, 230, 255, 0.3);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
          }
          .resume-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 0 45px rgba(255, 78, 205, 0.6);
          }

          .neon-text {
            color: #00e6ff;
            text-shadow: 0 0 12px #00e6ff, 0 0 24px #ff4ecd;
          }

          .loading-animation {
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid #00e6ff;
            border-radius: 50%;
            display: inline-block;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </section>
  );
};

export default Resume;
