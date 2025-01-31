const WebSocket = require('ws');
const { verifyToken } = require('./jwt.utils');
const chatService = require('../services/chat.service');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    try {
      // Get token from query string
      const token = req.url.split('=')[1];
      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      // Verify token
      const decoded = verifyToken(token);
      if (!decoded) {
        ws.close(4002, 'Invalid token');
        return;
      }

      // Attach user ID to websocket connection
      ws.userId = decoded.userId;
      
      // Handle connection in chat service
      chatService.handleConnection(ws, decoded.userId);

    } catch (error) {
      ws.close(4003, error.message);
    }
  });

  return wss;
};

// Utility function to send message to specific user
const sendWebSocketMessage = (userId, message) => {
  const ws = chatService.connections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

module.exports = {
  setupWebSocket,
  sendWebSocketMessage
};

