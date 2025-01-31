class ConnectionModel {
    static async create(mentorId, menteeId) {
      return dbAsync.run(
        'INSERT INTO connections (mentor_id, mentee_id) VALUES (?, ?)',
        [mentorId, menteeId]
      );
    }
  
    static async findById(id) {
      return dbAsync.get('SELECT * FROM connections WHERE id = ?', [id]);
    }
  
    static async updateStatus(id, status) {
      return dbAsync.run(
        'UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
    }
  
    static async findUserConnections(userId) {
      return dbAsync.all(`
        SELECT * FROM connections 
        WHERE mentor_id = ? OR mentee_id = ?
      `, [userId, userId]);
    }
  
    static async updateProgress(id, goals, progressNotes) {
      return dbAsync.run(
        `UPDATE connections 
         SET goals = ?, progress_notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(goals), JSON.stringify(progressNotes), id]
      );
    }
  }
  
  module.exports = ConnectionModel;