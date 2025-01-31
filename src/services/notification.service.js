const NotificationModel = require('../models/notification.model');
const { ValidationError } = require('../utils/errors');

class NotificationService {
  // Define notification types as static property
  static NOTIFICATION_TYPES = {
    CONNECTION_REQUEST: 'connection_request',
    CONNECTION_ACCEPTED: 'connection_accepted',
    CONNECTION_REJECTED: 'connection_rejected',
    CONNECTION_COMPLETED: 'connection_completed',
    CONNECTION_UPDATE: 'connection_update',
    MESSAGE_RECEIVED: 'message_received',
    GOAL_COMPLETED: 'goal_completed',
    MEETING_SCHEDULED: 'meeting_scheduled',
    PROFILE_UPDATE: 'profile_update',
    SYSTEM_NOTIFICATION: 'system_notification',
    PROGRESS_UPDATE: 'progress_update'
  };

  async createNotification(userId, type, content) {
    try {
      // Log the incoming notification request
      console.log('Creating notification:', { userId, type, content });

      // Validate notification type
      if (!Object.values(NotificationService.NOTIFICATION_TYPES).includes(type)) {
        console.error('Invalid notification type:', type);
        console.log('Valid types:', Object.values(NotificationService.NOTIFICATION_TYPES));
        throw new ValidationError(`Invalid notification type: ${type}`);
      }

      const notification = await NotificationModel.create(userId, type, content);
      
      return notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId) {
    try {
      return NotificationModel.getUserNotifications(userId);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      await NotificationModel.markAsRead(notificationId, userId);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await NotificationModel.markAllAsRead(userId);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Cleanup method to remove old notifications
  async cleanupOldNotifications() {
    try {
      await NotificationModel.deleteOldNotifications(30);
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
