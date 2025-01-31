const express = require('express');
const router = express.Router();
const chatService = require('../services/chat.service');
const { ValidationError } = require('../utils/errors');

// Get messages for a connection
router.get('/:connectionId/messages', async (req, res, next) => {
  try {
    const messages = await chatService.getConnectionMessages(
      req.params.connectionId,
      req.user.id
    );
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Send a message (REST fallback if WebSocket isn't available)
router.post('/:connectionId/messages', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      throw new ValidationError('Message cannot be empty');
    }

    const savedMessage = await chatService.handleMessage(req.user.id, {
      connectionId: req.params.connectionId,
      message: message
    });

    res.status(201).json(savedMessage);
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.post('/:connectionId/read', async (req, res, next) => {
  try {
    await chatService.markMessagesAsRead(
      req.params.connectionId,
      req.user.id
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;