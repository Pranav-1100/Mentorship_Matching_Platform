const SessionModel = require('../models/session.model');
const ConnectionModel = require('../models/connection.model');
const NotificationService = require('./notification.service');
const { ValidationError, AuthorizationError } = require('../utils/errors');

class SessionService {
  async createSession(userId, sessionData) {
    try {
      // Verify connection exists and user is part of it
      const connection = await ConnectionModel.findById(sessionData.connection_id);
      if (!connection) {
        throw new ValidationError('Invalid connection');
      }

      if (connection.mentor_id !== userId && connection.mentee_id !== userId) {
        throw new AuthorizationError('Not authorized to create session for this connection');
      }

      // Create session
      const session = await SessionModel.create({
        mentor_id: connection.mentor_id,
        mentee_id: connection.mentee_id,
        connection_id: connection.id,
        scheduled_at: sessionData.date,
        duration: sessionData.duration,
        topic: sessionData.topic,
        meeting_link: sessionData.meeting_link
      });

      // Send notification to other user
      const otherUserId = connection.mentor_id === userId ? connection.mentee_id : connection.mentor_id;
      await NotificationService.createNotification(
        otherUserId,
        'session_scheduled',
        `New session scheduled for ${new Date(sessionData.date).toLocaleDateString()}`
      );

      return session;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  }

  async getUserSessions(userId) {
    try {
      const sessions = await SessionModel.getUserSessions(userId);
      return this.formatSessionsResponse(sessions, userId);
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      throw error;
    }
  }

  async updateSessionStatus(sessionId, userId, data) {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        throw new ValidationError('Session not found');
      }

      if (session.mentor_id !== userId && session.mentee_id !== userId) {
        throw new AuthorizationError('Not authorized to update this session');
      }

      await SessionModel.updateStatus(sessionId, data.status, data.reschedule_date);

      // Notify other participant
      const otherUserId = session.mentor_id === userId ? session.mentee_id : session.mentor_id;
      await NotificationService.createNotification(
        otherUserId,
        'session_updated',
        `Session ${data.status === 'cancelled' ? 'cancelled' : 'rescheduled'}`
      );

      return SessionModel.findById(sessionId);
    } catch (error) {
      console.error('Error in updateSessionStatus:', error);
      throw error;
    }
  }

  formatSessionsResponse(sessions, currentUserId) {
    return sessions.map(session => ({
      id: session.id,
      mentor: {
        id: session.mentor_id,
        name: session.mentor_id === currentUserId ? 'You' : session.other_user_name,
        avatar: session.mentor_id === currentUserId ? null : session.other_user_avatar,
        position: session.mentor_id === currentUserId ? null : session.other_user_position
      },
      mentee: {
        id: session.mentee_id,
        name: session.mentee_id === currentUserId ? 'You' : session.other_user_name,
        avatar: session.mentee_id === currentUserId ? null : session.other_user_avatar,
        position: session.mentee_id === currentUserId ? null : session.other_user_position
      },
      date: session.scheduled_at,
      duration: session.duration,
      status: session.status,
      meeting_link: session.meeting_link,
      topic: session.topic
    }));
  }
}

module.exports = new SessionService();

