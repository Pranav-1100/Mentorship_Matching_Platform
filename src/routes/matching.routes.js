const express = require('express');
const router = express.Router();
const matchingService = require('../services/matching.service');
const { validateMatchingPreferences } = require('../middlewares/validate.middleware');

// Get potential matches
router.get('/potential-matches', async (req, res, next) => {
  try {
    const matches = await matchingService.findMatches(req.user.id);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// Update matching preferences
router.post('/preferences', validateMatchingPreferences, async (req, res, next) => {
  try {
    const preferences = await matchingService.updatePreferences(req.user.id, req.body);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Get matching preferences
router.get('/preferences', async (req, res, next) => {
  try {
    const preferences = await matchingService.getPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
