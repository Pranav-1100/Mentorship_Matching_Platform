const { dbAsync } = require('../config/database');

class SessionModel {
  static async create(sessionData) {
    const {
      mentor_id,
      mentee_id,
      connection_id,
      scheduled_at,
      duration,
      topic,
      meeting_link = null,
      notes = null
    } = sessionData;

    const result = await dbAsync.run(`
      INSERT INTO sessions (
        mentor_id, mentee_id, connection_id, scheduled_at, 
        duration, topic, meeting_link, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mentor_id, mentee_id, connection_id, scheduled_at,
      duration, topic, meeting_link, notes
    ]);

    return this.findById(result.id);
  }

  static async findById(id) {
    return dbAsync.get(`
      SELECT 
        s.*,
        u1.email as mentor_email,
        p1.full_name as mentor_name,
        p1.photo_url as mentor_avatar,
        p1.current_position as mentor_position,
        u2.email as mentee_email,
        p2.full_name as mentee_name,
        p2.photo_url as mentee_avatar
      FROM sessions s
      JOIN users u1 ON s.mentor_id = u1.id
      JOIN profiles p1 ON u1.id = p1.user_id
      JOIN users u2 ON s.mentee_id = u2.id
      JOIN profiles p2 ON u2.id = p2.user_id
      WHERE s.id = ?
    `, [id]);
  }

  static async getUserSessions(userId) {
    return dbAsync.all(`
      SELECT 
        s.*,
        u.email as other_user_email,
        p.full_name as other_user_name,
        p.photo_url as other_user_avatar,
        p.current_position as other_user_position
      FROM sessions s
      JOIN users u ON (
        CASE 
          WHEN s.mentor_id = ? THEN s.mentee_id = u.id
          ELSE s.mentor_id = u.id
        END
      )
      JOIN profiles p ON u.id = p.user_id
      WHERE s.mentor_id = ? OR s.mentee_id = ?
      ORDER BY s.scheduled_at DESC
    `, [userId, userId, userId]);
  }

  static async updateStatus(id, status, rescheduledDate = null) {
    if (rescheduledDate) {
      return dbAsync.run(`
        UPDATE sessions 
        SET status = ?, scheduled_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, rescheduledDate, id]);
    }
    
    return dbAsync.run(`
      UPDATE sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);
  }

  static async addNotes(id, notes) {
    return dbAsync.run(`
      UPDATE sessions 
      SET notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [notes, id]);
  }
}

module.exports = SessionModel;
