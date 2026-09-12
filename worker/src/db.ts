/**
 * Hand-written SQL against D1. No ORM, no query builder.
 *
 * Multi-valued fields live in child tables, so each list endpoint runs a small
 * batch (parent + children) in a single round trip and stitches the rows
 * together here. Ordering is always explicit in SQL rather than left to the
 * query planner.
 */

export interface ProjectRow {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string | null;
  githubUrl: string | null;
}

export interface TestimonialRow {
  _id: string;
  name: string;
  role: string;
  avatar: string | null;
  text: string;
}

export interface HackathonRow {
  _id: string;
  title: string;
  date: string;
  duration: string | null;
  image: string | null;
  description: string;
  achievement: string | null;
  teamSize: number | null;
  gitUrl: string | null;
  projectUrl: string | null;
  videoUrl: string | null;
}

export interface ExperienceRow {
  _id: string;
  role: string;
  company: string;
  companyUrl: string | null;
  employmentType: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  summary: string | null;
}

/** Groups child rows by their parent id, preserving the SQL result order. */
function groupBy<T, K extends keyof T>(rows: T[], key: K, value: (row: T) => string) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const parent = String(row[key]);
    const list = map.get(parent);
    if (list) list.push(value(row));
    else map.set(parent, [value(row)]);
  }
  return map;
}

export async function listProjects(db: D1Database) {
  const [parents, tech, shots] = await db.batch<any>([
    db.prepare(
      `SELECT id AS _id, title, description, long_description AS longDescription,
              image, github_url AS githubUrl
         FROM projects
        ORDER BY position, title`
    ),
    db.prepare(`SELECT project_id, tech FROM project_tech ORDER BY project_id, position`),
    db.prepare(`SELECT project_id, url FROM project_screenshots ORDER BY project_id, position`),
  ]);

  const techByProject = groupBy(tech.results, 'project_id', (r) => r.tech);
  const shotsByProject = groupBy(shots.results, 'project_id', (r) => r.url);

  return (parents.results as ProjectRow[]).map((project) => ({
    ...project,
    techStack: techByProject.get(project._id) ?? [],
    screenshots: shotsByProject.get(project._id) ?? [],
  }));
}

export async function listTestimonials(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT id AS _id, name, role, avatar, text
         FROM testimonials
        ORDER BY position, name`
    )
    .all<TestimonialRow>();
  const approved = await db.prepare(`SELECT id AS _id,name,role,company,experience,relationship,
    '/api/reviews/photo/' || id AS avatar,message AS text FROM testimonial_submissions
    WHERE status='approved' ORDER BY created_at DESC`).all();
  return [...approved.results, ...results];
}

export async function listHackathons(db: D1Database) {
  const [parents, tech] = await db.batch<any>([
    db.prepare(
      `SELECT id AS _id, title, event_date AS date, duration, image, description,
              achievement, team_size AS teamSize, git_url AS gitUrl,
              project_url AS projectUrl, video_url AS videoUrl
         FROM hackathons
        ORDER BY sort_date DESC, title`
    ),
    db.prepare(`SELECT hackathon_id, tech FROM hackathon_tech ORDER BY hackathon_id, position`),
  ]);

  const techByHackathon = groupBy(tech.results, 'hackathon_id', (r) => r.tech);

  return (parents.results as HackathonRow[]).map((hackathon) => {
    const row: Record<string, unknown> = {
      ...hackathon,
      techStack: techByHackathon.get(hackathon._id) ?? [],
    };
    // The Mongo API omitted these keys entirely when unset; keep that contract
    // so the response stays byte-identical to what the frontend already gets.
    for (const optional of ['projectUrl', 'videoUrl'] as const) {
      if (row[optional] === null) delete row[optional];
    }
    return row;
  });
}

export async function listExperience(db: D1Database) {
  const [parents, highlights, skills] = await db.batch<any>([
    db.prepare(
      `SELECT id AS _id, role, company, company_url AS companyUrl,
              employment_type AS employmentType, location,
              start_date AS startDate, end_date AS endDate, summary
         FROM experience
        ORDER BY start_date DESC`
    ),
    db.prepare(`SELECT experience_id, highlight FROM experience_highlights ORDER BY experience_id, position`),
    db.prepare(`SELECT experience_id, skill FROM experience_skills ORDER BY experience_id, position`),
  ]);

  const highlightsByRole = groupBy(highlights.results, 'experience_id', (r) => r.highlight);
  const skillsByRole = groupBy(skills.results, 'experience_id', (r) => r.skill);

  return (parents.results as ExperienceRow[]).map((role) => ({
    ...role,
    highlights: highlightsByRole.get(role._id) ?? [],
    skills: skillsByRole.get(role._id) ?? [],
  }));
}

/** Submissions from one IP inside the window, used for rate limiting. */
export async function countRecentContacts(db: D1Database, ip: string, sinceIso: string) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM contacts WHERE ip = ?1 AND created_at >= ?2`)
    .bind(ip, sinceIso)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function insertContact(
  db: D1Database,
  contact: { id: string; name: string; email: string; message: string; ip: string; createdAt: string }
) {
  await db
    .prepare(
      `INSERT INTO contacts (id, name, email, message, ip, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(contact.id, contact.name, contact.email, contact.message, contact.ip, contact.createdAt)
    .run();
}

export async function markContactNotified(db: D1Database, id: string) {
  await db.prepare(`UPDATE contacts SET notified = 1 WHERE id = ?1`).bind(id).run();
}
