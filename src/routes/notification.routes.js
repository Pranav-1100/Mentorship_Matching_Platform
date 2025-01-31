const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');

// Get all notifications for current user
router.get('/', async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Mark a notification as read
router.post('/:id/read', async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.post('/read-all', async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;