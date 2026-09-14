CREATE TABLE IF NOT EXISTS contact_state (
  contact_id TEXT PRIMARY KEY REFERENCES contacts(id),
  state TEXT NOT NULL DEFAULT 'unread' CHECK(state IN ('unread','read','archived','trash'))
);
CREATE TABLE IF NOT EXISTS legacy_review_state (
  testimonial_id TEXT PRIMARY KEY REFERENCES testimonials(id), hidden INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS site_sections (name TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO site_sections VALUES ('photos',0),('blog',0),('interests',0);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL,
  size INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS content_entries (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('photos','blog','interests')),
  title TEXT NOT NULL DEFAULT '', slug TEXT NOT NULL UNIQUE, body TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '', alt TEXT NOT NULL DEFAULT '', media_id TEXT REFERENCES media(id),
  source_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','trash')),
  position INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id TEXT NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL
);
