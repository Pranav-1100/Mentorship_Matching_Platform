const { dbAsync } = require('../config/database');

class ApplicationModel {
  static async create(applicationData) {
    try {
      const { mentor_id, mentee_id, message } = applicationData;

      // Check for existing application
      const existing = await this.findExisting(mentor_id, mentee_id);
      if (existing) {
        throw new Error('Application already exists');
      }

      const result = await dbAsync.run(`
        INSERT INTO applications (mentor_id, mentee_id, message)
        VALUES (?, ?, ?)
      `, [mentor_id, mentee_id, message]);

      return this.findById(result.id);
    } catch (error) {
      console.error('Error in create application:', error);
      throw error;
    }
  }

  static async findById(id) {
    return dbAsync.get(`
      SELECT 
        a.*,
        u1.email as mentor_email,
        p1.full_name as mentor_name,
        p1.photo_url as mentor_avatar,
        p1.current_position as mentor_position,
        p1.current_company as mentor_company,
        u2.email as mentee_email,
        p2.full_name as mentee_name,
        p2.photo_url as mentee_avatar,
        p2.current_position as mentee_position,
        p2.current_company as mentee_company
      FROM applications a
      JOIN users u1 ON a.mentor_id = u1.id
      JOIN profiles p1 ON u1.id = p1.user_id
      JOIN users u2 ON a.mentee_id = u2.id
      JOIN profiles p2 ON u2.id = p2.user_id
      WHERE a.id = ?
    `, [id]);
  }

  static async findExisting(mentorId, menteeId) {
    return dbAsync.get(
      'SELECT * FROM applications WHERE mentor_id = ? AND mentee_id = ?',
      [mentorId, menteeId]
    );
  }

  static async getUserApplications(userId) {
    return dbAsync.all(`
      SELECT 
        a.*,
        u.email as other_user_email,
        p.full_name as other_user_name,
        p.photo_url as other_user_avatar,
        p.current_position as other_user_position,
        p.current_company as other_user_company
      FROM applications a
      JOIN users u ON (
        CASE 
          WHEN a.mentor_id = ? THEN a.mentee_id = u.id
          ELSE a.mentor_id = u.id
        END
      )
      JOIN profiles p ON u.id = p.user_id
      WHERE a.mentor_id = ? OR a.mentee_id = ?
      ORDER BY a.created_at DESC
    `, [userId, userId, userId]);
  }

  static async updateStatus(id, status) {
    return dbAsync.run(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);
  }

  static async delete(id) {
    return dbAsync.run('DELETE FROM applications WHERE id = ?', [id]);
  }
}

module.exports = ApplicationModel;
