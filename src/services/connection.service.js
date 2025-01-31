const { dbAsync } = require('../config/database');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const { ValidationError, AuthorizationError } = require('../utils/errors');
const notificationService = require('./notification.service');

const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONNECTION_REJECTED: 'connection_rejected',
  CONNECTION_COMPLETED: 'connection_completed',
  CONNECTION_UPDATE: 'connection_update',
  PROGRESS_UPDATE: 'progress_update'
};

class ConnectionService {
  async createConnection(fromUserId, toUserId, type) {
    try {
      const [fromUser, toUser] = await Promise.all([
        this.getUserWithDetails(fromUserId),
        this.getUserWithDetails(toUserId)
      ]);

      console.log('Connection attempt:', {
        fromUser: { id: fromUser.id, role: fromUser.role },
        toUser: { id: toUser.id, role: toUser.role },
        type
      });

      if (!fromUser || !toUser) {
        throw new ValidationError('One or both users not found');
      }

      if (!fromUser.is_active || !toUser.is_active) {
        throw new ValidationError('One or both users are inactive');
      }

      const roleCheck = this.checkRoleCompatibility(fromUser, toUser, type);
      if (!roleCheck.isValid) {
        throw new ValidationError(roleCheck.message);
      }

      const existingConnection = await this.getExistingConnection(fromUserId, toUserId);
      if (existingConnection) {
        throw new ValidationError('A connection already exists between these users');
      }

      const mentorId = type === 'mentor_request' ? toUserId : fromUserId;
      const menteeId = type === 'mentor_request' ? fromUserId : toUserId;

      const result = await dbAsync.run(`
        INSERT INTO connections (
          mentor_id, 
          mentee_id, 
          status,
          meeting_frequency,
          goals,
          progress_notes
        ) VALUES (?, ?, 'pending', 'weekly', '[]', '[]')`,
        [mentorId, menteeId]
      );

      // Send notification using consistent notification type
      await notificationService.createNotification(
        toUserId,
        NOTIFICATION_TYPES.CONNECTION_REQUEST,
        `New ${type} from ${fromUser.full_name || fromUser.email}`
      );

      const newConnection = await this.getConnectionById(result.id);
      return {
        ...newConnection,
        mentor: type === 'mentor_request' ? toUser : fromUser,
        mentee: type === 'mentor_request' ? fromUser : toUser
      };
    } catch (error) {
      console.error('Error in createConnection:', error);
      throw error;
    }
  }

  checkRoleCompatibility(fromUser, toUser, type) {
    if (type === 'mentor_request') {
      const canToUserBeMentor = ['mentor', 'both'].includes(toUser.role);
      const canFromUserBeMentee = ['mentee', 'both'].includes(fromUser.role);

      if (!canToUserBeMentor) {
        return {
          isValid: false,
          message: 'Target user cannot be a mentor based on their role'
        };
      }
      if (!canFromUserBeMentee) {
        return {
          isValid: false,
          message: 'You cannot be a mentee based on your role'
        };
      }
    } else if (type === 'mentee_request') {
      const canToUserBeMentee = ['mentee', 'both'].includes(toUser.role);
      const canFromUserBeMentor = ['mentor', 'both'].includes(fromUser.role);

      if (!canToUserBeMentee) {
        return {
          isValid: false,
          message: 'Target user cannot be a mentee based on their role'
        };
      }
      if (!canFromUserBeMentor) {
        return {
          isValid: false,
          message: 'You cannot be a mentor based on your role'
        };
      }
    } else {
      return {
        isValid: false,
        message: 'Invalid connection type'
      };
    }

    return { isValid: true };
  }

  async getUserWithDetails(userId) {
    const user = await UserModel.findById(userId);
    if (user) {
      const profile = await ProfileModel.findByUserId(userId);
      return { ...user, ...profile };
    }
    return null;
  }

  async updateConnectionStatus(connectionId, userId, status) {
    try {
      const connection = await this.getConnectionById(connectionId);
      if (!connection) {
        throw new ValidationError('Connection not found');
      }

      if (connection.mentor_id !== userId && connection.mentee_id !== userId) {
        throw new AuthorizationError('Not authorized to update this connection');
      }

      const validStatuses = ['accepted', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid status');
      }

      await dbAsync.run(
        'UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, connectionId]
      );

      // Map status to notification type
      let notificationType;
      switch (status) {
        case 'accepted':
          notificationType = NOTIFICATION_TYPES.CONNECTION_ACCEPTED;
          break;
        case 'rejected':
          notificationType = NOTIFICATION_TYPES.CONNECTION_REJECTED;
          break;
        case 'completed':
          notificationType = NOTIFICATION_TYPES.CONNECTION_COMPLETED;
          break;
        default:
          notificationType = NOTIFICATION_TYPES.CONNECTION_UPDATE;
      }

      const otherUserId = connection.mentor_id === userId 
        ? connection.mentee_id 
        : connection.mentor_id;

      await notificationService.createNotification(
        otherUserId,
        notificationType,
        `Connection request ${status}`
      );

      return this.getConnectionById(connectionId);
    } catch (error) {
      console.error('Error in updateConnectionStatus:', error);
      throw error;
    }
  }

  async updateProgress(connectionId, userId, goals, notes) {
    try {
      const connection = await this.getConnectionById(connectionId);
      if (!connection) {
        throw new ValidationError('Connection not found');
      }

      if (connection.mentor_id !== userId && connection.mentee_id !== userId) {
        throw new AuthorizationError('Not authorized to update this connection');
      }

      await dbAsync.run(
        `UPDATE connections 
         SET goals = ?, progress_notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(goals), JSON.stringify(notes), connectionId]
      );

      const otherUserId = connection.mentor_id === userId 
        ? connection.mentee_id 
        : connection.mentor_id;

      await notificationService.createNotification(
        otherUserId,
        NOTIFICATION_TYPES.PROGRESS_UPDATE,
        'Connection progress has been updated'
      );

      return this.getConnectionById(connectionId);
    } catch (error) {
      console.error('Error in updateProgress:', error);
      throw error;
    }
  }
  async getUserConnections(userId) {
    try {
      return dbAsync.all(`
        SELECT 
          c.*,
          CASE 
            WHEN c.mentor_id = ? THEN 'mentor'
            ELSE 'mentee'
          END as user_role
        FROM connections c
        WHERE c.mentor_id = ? OR c.mentee_id = ?
        ORDER BY c.created_at DESC
      `, [userId, userId, userId]);
    } catch (error) {
      console.error('Error in getUserConnections:', error);
      throw error;
    }
  }

  async getConnectionById(connectionId) {
    return dbAsync.get('SELECT * FROM connections WHERE id = ?', [connectionId]);
  }

  async getExistingConnection(user1Id, user2Id) {
    return dbAsync.get(`
      SELECT * FROM connections 
      WHERE (mentor_id = ? AND mentee_id = ?) 
         OR (mentor_id = ? AND mentee_id = ?)
    `, [user1Id, user2Id, user2Id, user1Id]);
  }
  areRolesCompatible(fromUser, toUser, type) {
    if (type === 'mentor_request') {
      return (toUser.role === 'mentor' || toUser.role === 'both') &&
             (fromUser.role === 'mentee' || fromUser.role === 'both');
    } else if (type === 'mentee_request') {
      return (toUser.role === 'mentee' || toUser.role === 'both') &&
             (fromUser.role === 'mentor' || fromUser.role === 'both');
    }
    return false;
  }
}

module.exports = new ConnectionService();
