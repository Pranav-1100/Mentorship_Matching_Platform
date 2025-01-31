const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const profileService = require('../services/profile.service');
const { validateProfile } = require('../middlewares/validate.middleware');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/photos/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get profile
router.get('/me', async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Create/Update profile photo
router.post('/me/photo', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const profile = await profileService.upsertProfile(req.user.id, {
      photo_url: photoUrl
    });
    res.json({ photo_url: photoUrl });
  } catch (error) {
    next(error);
  }
});

// Create profile (POST)
router.post('/me', validateProfile, async (req, res, next) => {
  try {
    const { full_name, industry, years_experience } = req.body;
    if (!full_name || !industry || years_experience === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: full_name, industry, and years_experience are required'
      });
    }

    const profile = await profileService.upsertProfile(req.user.id, req.body);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
});

// Update profile (PUT)
router.put('/me', validateProfile, async (req, res, next) => {
  try {
    const { full_name, industry, years_experience } = req.body;
    if (!full_name || !industry || years_experience === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: full_name, industry, and years_experience are required'
      });
    }

    const profile = await profileService.upsertProfile(req.user.id, req.body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Get user skills
router.get('/me/skills', async (req, res, next) => {
  try {
    const skills = await profileService.getUserSkills(req.user.id);
    res.json(skills);
  } catch (error) {
    next(error);
  }
});

// Update user skills
router.put('/me/skills', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.skills)) {
      return res.status(400).json({
        message: 'Skills must be provided as an array'
      });
    }

    const skills = await profileService.updateUserSkills(req.user.id, req.body.skills);
    res.json(skills);
  } catch (error) {
    next(error);
  }
});

// Get profile by id (public data only)
router.get('/:userId', async (req, res, next) => {
  try {
    const profile = await profileService.getPublicProfile(req.params.userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;