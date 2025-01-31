const { dbAsync } = require('../config/database');

class NotificationModel {
  static async create(userId, type, content) {
    try {
      const result = await dbAsync.run(
        'INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)',
        [userId, type, content]
      );
      return this.findById(result.id);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async findById(id) {
    return dbAsync.get('SELECT * FROM notifications WHERE id = ?', [id]);
  }

  static async getUserNotifications(userId) {
    return dbAsync.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  static async markAsRead(id, userId) {
    return dbAsync.run(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  static async markAllAsRead(userId) {
    return dbAsync.run(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [userId]
    );
  }

  static async deleteOldNotifications(daysOld = 30) {
    return dbAsync.run(`
      DELETE FROM notifications 
      WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [daysOld]
    );
  }
}

module.exports = NotificationModel;