const { dbAsync } = require('../config/database');
const { ValidationError, AuthorizationError } = require('../utils/errors');
const notificationService = require('./notification.service');

class ChatService {
  constructor() {
    this.connections = new Map(); // Store WebSocket connections
  }

  // WebSocket message handler
  async handleConnection(ws, userId) {
    // Store the WebSocket connection
    this.connections.set(userId, ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleMessage(userId, data);
      } catch (error) {
        ws.send(JSON.stringify({ error: error.message }));
      }
    });

    ws.on('close', () => {
      this.connections.delete(userId);
    });
  }

  async handleMessage(senderId, data) {
    const { connectionId, message } = data;

    // Verify user is part of the connection
    const isValidParticipant = await this.verifyConnectionParticipant(connectionId, senderId);
    if (!isValidParticipant) {
      throw new AuthorizationError('Not authorized to send messages in this connection');
    }

    // Save message to database
    const savedMessage = await this.saveMessage(connectionId, senderId, message);

    // Get connection details to find recipient
    const connection = await dbAsync.get('SELECT * FROM connections WHERE id = ?', [connectionId]);
    const recipientId = connection.mentor_id === senderId ? connection.mentee_id : connection.mentor_id;

    // Send real-time message if recipient is connected
    const recipientWs = this.connections.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'message',
        data: savedMessage
      }));
    }

    // Create notification for offline recipient
    await notificationService.createNotification(
      recipientId,
      'message_received',
      'You have a new message'
    );

    return savedMessage;
  }

  async getConnectionMessages(connectionId, userId) {
    // Verify user is part of the connection
    const isValidParticipant = await this.verifyConnectionParticipant(connectionId, userId);
    if (!isValidParticipant) {
      throw new AuthorizationError('Not authorized to view these messages');
    }

    return dbAsync.all(`
      SELECT 
        m.*,
        u.email as sender_email,
        p.full_name as sender_name
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE m.connection_id = ?
      ORDER BY m.created_at ASC
    `, [connectionId]);
  }

  async markMessagesAsRead(connectionId, userId) {
    // Verify user is part of the connection
    const isValidParticipant = await this.verifyConnectionParticipant(connectionId, userId);
    if (!isValidParticipant) {
      throw new AuthorizationError('Not authorized');
    }

    await dbAsync.run(`
      UPDATE chat_messages 
      SET is_read = true 
      WHERE connection_id = ? AND sender_id != ?
    `, [connectionId, userId]);

    return { success: true };
  }

  // Helper methods
  async saveMessage(connectionId, senderId, content) {
    const result = await dbAsync.run(`
      INSERT INTO chat_messages (connection_id, sender_id, message, is_read)
      VALUES (?, ?, ?, false)
    `, [connectionId, senderId, content]);

    return this.getMessageById(result.id);
  }

  async getMessageById(messageId) {
    return dbAsync.get('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
  }

  async verifyConnectionParticipant(connectionId, userId) {
    const connection = await dbAsync.get(`
      SELECT * FROM connections 
      WHERE id = ? AND (mentor_id = ? OR mentee_id = ?)
    `, [connectionId, userId, userId]);

    return Boolean(connection);
  }
}

module.exports = new ChatService();
