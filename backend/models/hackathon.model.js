const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const hackathonSchema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  duration: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [{ type: String, required: true }],
  achievement: { type: String, required: true },
  teamSize: { type: Number, required: true },
  gitUrl:{ type: String, required: true },
  projectUrl: { type: String },
  videoUrl: { type: String },
});

const Hackathon = mongoose.model('Hackathon', hackathonSchema);

module.exports = Hackathon;