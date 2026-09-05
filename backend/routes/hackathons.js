const router = require('express').Router();
let Hackathon = require('../models/hackathon.model');

router.route('/').get((req, res) => {
  Hackathon.find()
    .then(hackathons => res.json(hackathons))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;