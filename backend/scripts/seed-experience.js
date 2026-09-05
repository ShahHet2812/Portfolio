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
const Experience = require('../models/experience.model');

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

async function main() {
  const placeholders = findPlaceholders(ROLES);
  if (placeholders.length > 0) {
    console.error('Refusing to seed — these fields still contain TODO placeholders:\n');
    placeholders.forEach((field) => console.error(`  • ${field}`));
    console.error('\nFill them in at the top of scripts/seed-experience.js, then re-run.');
    process.exit(1);
  }

  const uri = process.env.ATLAS_URI;
  if (!uri) {
    console.error('ATLAS_URI is not set. Add it to backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[seed] connected to MongoDB');

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
