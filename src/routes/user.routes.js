const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { validateUserUpdate } = require('../middlewares/validate.middleware');

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/me', validateUserUpdate, async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.user.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Deactivate account
router.delete('/me', async (req, res, next) => {
  try {
    await userService.deactivateUser(req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const { role, industry, experience_min, experience_max, search } = req.query;
    const users = await userService.getAllUsers({
      role,
      industry,
      experience_min: parseInt(experience_min),
      experience_max: parseInt(experience_max),
      search
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get all mentors
router.get('/mentors', async (req, res, next) => {
  try {
    const { industry, experience_min, experience_max, search } = req.query;
    const mentors = await userService.getUsersByRole('mentor', {
      industry,
      experience_min: parseInt(experience_min),
      experience_max: parseInt(experience_max),
      search
    });
    res.json(mentors);
  } catch (error) {
    next(error);
  }
});

// Get all mentees
router.get('/mentees', async (req, res, next) => {
  try {
    const { industry, experience_min, experience_max, search } = req.query;
    const mentees = await userService.getUsersByRole('mentee', {
      industry,
      experience_min: parseInt(experience_min),
      experience_max: parseInt(experience_max),
      search
    });
    res.json(mentees);
  } catch (error) {
    next(error);
  }
});


module.exports = router;

