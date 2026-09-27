-- Additive migration for the owner dashboard, Security Lab and Identity Journal.
-- Safe to run against the existing production database; no existing table is rebuilt.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_sections (
  name TEXT PRIMARY KEY CHECK (name IN ('lab','journal')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO site_sections (name, enabled) VALUES ('lab',0),('journal',0);

CREATE TABLE IF NOT EXISTS content_entries (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('lab','journal_post','photo_story','interest','now')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  category TEXT,
  difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('beginner','intermediate','advanced')),
  tools_json TEXT NOT NULL DEFAULT '[]',
  references_json TEXT NOT NULL DEFAULT '[]',
  repository_url TEXT,
  demo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','trash')),
  position INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kind, slug)
);
CREATE INDEX IF NOT EXISTS idx_content_public ON content_entries(kind,status,position,published_at);

CREATE TABLE IF NOT EXISTS content_tags (
  entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (entry_id, tag)
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload','drive','photos')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entry_media (
  entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT,
  PRIMARY KEY (entry_id, media_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('planned','in_progress','earned')),
  issue_date TEXT,
  expiry_date TEXT,
  credential_url TEXT,
  badge_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entry_id, revision)
);

CREATE TABLE IF NOT EXISTS contact_state (
  contact_id TEXT PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'unread' CHECK (state IN ('unread','read','archived','trash')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legacy_testimonial_visibility (
  testimonial_id TEXT PRIMARY KEY REFERENCES testimonials(id) ON DELETE CASCADE,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_subject TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_recent ON admin_audit_events(created_at DESC);
