const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String, required: true }, // full description for modal
  image: { type: String, required: true },
  techStack: [{ type: String, required: true }],
  githubUrl: { type: String, required: true }, 
  screenshots: [{ type: String, required: true }], // array of images for modal
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
