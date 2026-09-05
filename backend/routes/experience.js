const router = require('express').Router();
const Experience = require('../models/experience.model');

// Newest first. startDate is stored as "YYYY-MM", so a plain descending
// string sort is chronological.
router.route('/').get((req, res) => {
  Experience.find()
    .sort({ startDate: -1 })
    .then((experience) => res.json(experience))
    .catch((err) => {
      console.error('[experience] query failed:', err.message);
      res.status(500).json({ error: 'Could not load experience.' });
    });
});

module.exports = router;
