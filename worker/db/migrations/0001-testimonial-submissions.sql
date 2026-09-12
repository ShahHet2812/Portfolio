-- Additive migration: does not modify existing content or contact messages.
CREATE TABLE IF NOT EXISTS testimonial_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  experience TEXT NOT NULL,
  relationship TEXT NOT NULL,
  message TEXT NOT NULL,
  photo BLOB NOT NULL,
  photo_type TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  notified INTEGER NOT NULL DEFAULT 0,
  ip TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS testimonial_submission_ip ON testimonial_submissions(ip, created_at);
