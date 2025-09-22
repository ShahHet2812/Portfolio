const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const projectsRouter = require('./routes/projects');
const testimonialsRouter = require('./routes/testimonials');
const hackathonsRouter = require('./routes/hackathons');
const contactRouter = require('./routes/contact');

app.use('/projects', projectsRouter);
app.use('/testimonials', testimonialsRouter);
app.use('/hackathons', hackathonsRouter);
app.use('/contact', contactRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});