/**
 * Seeds the `experiences` collection.
 *
 * Usage (from the backend/ directory, with .env populated):
 *   node scripts/seed-experience.js
 *
 * Idempotent: entries are matched on role + company, so re-running updates
 * rather than duplicating.
 */
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const Experience = require('../models/experience.model');
const Project = require('../models/project.model');

// ---------------------------------------------------------------------------
// EDIT THIS BLOCK. Anything still containing "TODO" will abort the run.
// Dates are "YYYY-MM". Omit endDate for the role you currently hold.
// ---------------------------------------------------------------------------
const COMPANY = 'Ray Secure Innovations Private Limited';
const LOCATION = 'Ahmedabad, Gujarat (On-site)';

const ROLES = [
  {
    role: 'Junior Network and Security Engineer',
    company: COMPANY,
    companyUrl: '',
    employmentType: 'Full-time',
    location: LOCATION,
    startDate: '2026-07',
    endDate: null,
    summary:
      'Moved into a permanent role in July 2026 after an eight-month internship, working on network infrastructure and security operations.',
    // Add bullets describing what you actually own, e.g.
    //   'Configure and monitor perimeter firewall rules across three sites'
    highlights: [],
    skills: ['Network Security', 'Firewalls', 'Routing & Switching', 'VLANs', 'Network Monitoring'],
  },
  {
    role: 'Network and Security Engineer Intern',
    company: COMPANY,
    companyUrl: '',
    employmentType: 'Internship',
    location: LOCATION,
    startDate: '2025-11',
    endDate: '2026-06',
    summary:
      'Eight-month internship across network infrastructure and security fundamentals, which converted into a full-time offer.',
    highlights: [],
    skills: ['Networking Fundamentals', 'Network Security', 'Troubleshooting'],
  },
];

const findPlaceholders = (roles) => {
  const found = [];
  roles.forEach((role, i) => {
    for (const [key, value] of Object.entries(role)) {
      const values = Array.isArray(value) ? value : [value];
      values.forEach((v) => {
        if (typeof v === 'string' && v.includes('TODO')) found.push(`ROLES[${i}].${key}`);
      });
    }
  });
  return found;
};

/** Returns a human-readable problem with ATLAS_URI, or null if it looks usable. */
function describeUriProblem(uri) {
  if (!uri) return 'ATLAS_URI is not set in backend/.env';
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    return 'ATLAS_URI must start with "mongodb://" or "mongodb+srv://"';
  }
  if (/[<>]/.test(uri)) {
    return 'ATLAS_URI still has an unfilled placeholder in angle brackets (e.g. <db_password>)';
  }
  return null;
}

async function main() {
  const placeholders = findPlaceholders(ROLES);
  if (placeholders.length > 0) {
    console.error('Refusing to seed — these fields still contain TODO placeholders:\n');
    placeholders.forEach((field) => console.error(`  • ${field}`));
    console.error('\nFill them in at the top of scripts/seed-experience.js, then re-run.');
    process.exit(1);
  }

  const uri = process.env.ATLAS_URI;
  const uriProblem = describeUriProblem(uri);
  if (uriProblem) {
    console.error(`Cannot connect: ${uriProblem}.\n`);
    console.error('Copy ATLAS_URI exactly as it appears in your Render dashboard (Environment tab)');
    console.error('into backend/.env — that value already has the right password and database name.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const dbName = mongoose.connection.name;
  console.log(`[seed] connected — database: "${dbName}"`);

  // The live site reads projects from this same database, so an empty projects
  // collection means we're pointed somewhere else (commonly the default "test"
  // database, when the URI omits a database name).
  const projectCount = await Project.estimatedDocumentCount();
  if (projectCount === 0 && !process.argv.includes('--force')) {
    console.error(`\nAborting: database "${dbName}" contains no projects.`);
    console.error('That almost certainly means this is not the database the live site uses.');
    console.error('Check that ATLAS_URI includes the database name, e.g.');
    console.error('  mongodb+srv://user:pass@cluster.mongodb.net/portfolio?retryWrites=true&w=majority');
    console.error('\nRe-run with --force if you are certain this database is correct.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`[seed] sanity check: found ${projectCount} project(s) in "${dbName}"`);

  for (const role of ROLES) {
    const result = await Experience.updateOne(
      { role: role.role, company: role.company },
      { $set: role },
      { upsert: true }
    );
    const action = result.upsertedCount > 0 ? 'inserted' : 'updated';
    console.log(`[seed] ${action}: ${role.role} @ ${role.company}`);
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
