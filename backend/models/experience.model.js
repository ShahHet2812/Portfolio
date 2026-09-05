const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const experienceSchema = new Schema({
  role: { type: String, required: true },
  company: { type: String, required: true },
  companyUrl: { type: String },
  // e.g. "Full-time", "Internship", "Contract"
  employmentType: { type: String, required: true },
  location: { type: String },
  // "YYYY-MM" so entries sort correctly and durations can be computed.
  startDate: { type: String, required: true },
  // Omit (or leave null) for the role you currently hold.
  endDate: { type: String },
  summary: { type: String },
  highlights: [{ type: String }],
  skills: [{ type: String }],
});

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
