const express = require('express');
const router = express.Router();
const sessionService = require('../services/session.service');
const { validateSession } = require('../middlewares/validate.middleware');

// Get all sessions for user
router.get('/', async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

// Create new session
router.post('/', validateSession, async (req, res, next) => {
  try {
    const session = await sessionService.createSession(req.user.id, req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Update session status
router.patch('/:id', async (req, res, next) => {
  try {
    const session = await sessionService.updateSessionStatus(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(session);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
