const router = require('express').Router();
let Testimonial = require('../models/testimonial.model');

router.route('/').get((req, res) => {
  Testimonial.find()
    .then(testimonials => res.json(testimonials))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;