-- Portfolio schema for Cloudflare D1 (SQLite).
--
-- Primary keys are 24-character hex strings rather than integers. That keeps
-- the ids migrated from MongoDB intact, so the API contract is unchanged and
-- the hackathon timeline can keep slicing them into git-style short hashes.
--
-- Multi-valued fields (tech stacks, screenshots, bullet lists) live in child
-- tables rather than JSON blobs; queries reassemble them with
-- json_group_array() so responses keep their original array shape.

DROP TABLE IF EXISTS project_screenshots;
DROP TABLE IF EXISTS project_tech;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS hackathon_tech;
DROP TABLE IF EXISTS hackathons;
DROP TABLE IF EXISTS experience_highlights;
DROP TABLE IF EXISTS experience_skills;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS contacts;

-- ---------------------------------------------------------------- projects --

CREATE TABLE projects (
  id               TEXT    PRIMARY KEY,
  title            TEXT    NOT NULL,
  description      TEXT    NOT NULL,
  long_description TEXT    NOT NULL DEFAULT '',
  image            TEXT,
  github_url       TEXT,
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE project_tech (
  project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  tech       TEXT    NOT NULL,
  PRIMARY KEY (project_id, position)
);

CREATE TABLE project_screenshots (
  project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  url        TEXT    NOT NULL,
  PRIMARY KEY (project_id, position)
);

-- ------------------------------------------------------------ testimonials --

CREATE TABLE testimonials (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL,
  role       TEXT    NOT NULL,
  avatar     TEXT,
  text       TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------- hackathons --

CREATE TABLE hackathons (
  id          TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  event_date  TEXT    NOT NULL,
  duration    TEXT,
  image       TEXT,
  description TEXT    NOT NULL,
  achievement TEXT,
  team_size   INTEGER,
  git_url     TEXT,
  project_url TEXT,
  video_url   TEXT,
  -- Sortable form of event_date ("YYYY-MM-DD"); event_date stays human-readable.
  sort_date   TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE hackathon_tech (
  hackathon_id TEXT    NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  tech         TEXT    NOT NULL,
  PRIMARY KEY (hackathon_id, position)
);

-- -------------------------------------------------------------- experience --

CREATE TABLE experience (
  id              TEXT PRIMARY KEY,
  role            TEXT NOT NULL,
  company         TEXT NOT NULL,
  company_url     TEXT,
  employment_type TEXT NOT NULL,
  location        TEXT,
  -- "YYYY-MM". end_date NULL means the role is current.
  start_date      TEXT NOT NULL,
  end_date        TEXT,
  summary         TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE experience_highlights (
  experience_id TEXT    NOT NULL REFERENCES experience(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  highlight     TEXT    NOT NULL,
  PRIMARY KEY (experience_id, position)
);

CREATE TABLE experience_skills (
  experience_id TEXT    NOT NULL REFERENCES experience(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  skill         TEXT    NOT NULL,
  PRIMARY KEY (experience_id, position)
);

-- ---------------------------------------------------------------- contacts --

CREATE TABLE contacts (
  id         TEXT NOT NULL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  -- Best-effort audit trail for the rate limiter and abuse triage.
  ip         TEXT,
  notified   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_hackathons_sort_date ON hackathons(sort_date DESC);
CREATE INDEX idx_experience_start_date ON experience(start_date DESC);
