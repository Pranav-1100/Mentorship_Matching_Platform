const express = require('express');
const router = express.Router();
const MentorDetailsModel = require('../models/mentor.details.model');
const { validateMentorDetails } = require('../middlewares/validate.middleware');

// Get mentoring fields
router.get('/fields', async (req, res, next) => {
  try {
    const fields = await MentorDetailsModel.getMentoringFields();
    res.json(fields);
  } catch (error) {
    next(error);
  }
});

// Update mentor details
router.put('/details', validateMentorDetails, async (req, res, next) => {
  try {
    const details = await MentorDetailsModel.getByUserId(req.user.id);
    if (details) {
      await MentorDetailsModel.updateDetails(req.user.id, req.body);
    } else {
      await MentorDetailsModel.create({ user_id: req.user.id, ...req.body });
    }
    const updatedDetails = await MentorDetailsModel.getByUserId(req.user.id);
    res.json(updatedDetails);
  } catch (error) {
    next(error);
  }
});

// Get mentor details
router.get('/details/:userId', async (req, res, next) => {
  try {
    const details = await MentorDetailsModel.getByUserId(req.params.userId);
    if (!details) {
      return res.status(404).json({ message: 'Mentor details not found' });
    }
    res.json(details);
  } catch (error) {
    next(error);
  }
});

module.exports = router;