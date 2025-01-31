const express = require('express');
const router = express.Router();
const connectionService = require('../services/connection.service');
const { validateConnection, validateProgress } = require('../middlewares/validate.middleware');

// Get all user connections
router.get('/', async (req, res, next) => {
  try {
    const connections = await connectionService.getUserConnections(req.user.id);
    res.json(connections);
  } catch (error) {
    next(error);
  }
});

// Create new connection request
router.post('/', validateConnection, async (req, res, next) => {
  try {
    const { toUserId, type } = req.body;
    const connection = await connectionService.createConnection(req.user.id, toUserId, type);
    res.status(201).json(connection);
  } catch (error) {
    next(error);
  }
});

// Update connection status
router.patch('/:connectionId/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const connection = await connectionService.updateConnectionStatus(
      req.params.connectionId,
      req.user.id,
      status
    );
    res.json(connection);
  } catch (error) {
    next(error);
  }
});

// Update connection progress
router.post('/:connectionId/progress', validateProgress, async (req, res, next) => {
  try {
    const { goals, notes } = req.body;
    const progress = await connectionService.updateProgress(
      req.params.connectionId,
      req.user.id,
      goals,
      notes
    );
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

module.exports = router;