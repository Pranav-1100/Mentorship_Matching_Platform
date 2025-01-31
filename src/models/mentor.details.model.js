const { dbAsync } = require('../config/database');

class MentorDetailsModel {
  static async getByUserId(userId) {
    try {
      const details = await dbAsync.get(`
        SELECT 
          md.*,
          mf.name as mentoring_field_name,
          mf.category as mentoring_field_category
        FROM mentor_details md
        LEFT JOIN mentoring_fields mf ON md.mentoring_field_id = mf.id
        WHERE md.user_id = ?`,
        [userId]
      );
      return details || null;
    } catch (error) {
      console.error('Error in getByUserId:', error);
      return null;
    }
  }

  static async create(mentorData) {
    try {
      const {
        user_id,
        hourly_rate = null,
        currency = 'USD',
        mentoring_field_id = null,
        experience_description = '',
        session_details = ''
      } = mentorData;
      
      const result = await dbAsync.run(`
        INSERT INTO mentor_details 
        (user_id, hourly_rate, currency, mentoring_field_id, experience_description, session_details)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, hourly_rate, currency, mentoring_field_id, experience_description, session_details]
      );

      return this.getByUserId(user_id);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async updateDetails(userId, mentorData) {
    try {
      const {
        hourly_rate = null,
        currency = 'USD',
        mentoring_field_id = null,
        experience_description = '',
        session_details = ''
      } = mentorData;
      
      await dbAsync.run(`
        UPDATE mentor_details 
        SET hourly_rate = ?, 
            currency = ?,
            mentoring_field_id = ?,
            experience_description = ?,
            session_details = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [hourly_rate, currency, mentoring_field_id, experience_description, session_details, userId]
      );

      return this.getByUserId(userId);
    } catch (error) {
      console.error('Error in updateDetails:', error);
      throw error;
    }
  }

  static async createOrUpdate(userId, mentorData) {
    try {
      const existingDetails = await this.getByUserId(userId);

      if (existingDetails) {
        return this.updateDetails(userId, mentorData);
      } else {
        return this.create({ ...mentorData, user_id: userId });
      }
    } catch (error) {
      console.error('Error in createOrUpdate:', error);
      throw error;
    }
  }

  static async getMentoringFields() {
    try {
      const fields = await dbAsync.all(`
        SELECT 
          mf.*,
          COUNT(md.id) as mentor_count
        FROM mentoring_fields mf
        LEFT JOIN mentor_details md ON mf.id = md.mentoring_field_id
        GROUP BY mf.id
        ORDER BY mf.category, mf.name
      `);
      return fields;
    } catch (error) {
      console.error('Error in getMentoringFields:', error);
      return [];
    }
  }

  // New method to get mentors by field
  static async getMentorsByField(fieldId) {
    try {
      return dbAsync.all(`
        SELECT 
          u.id,
          u.email,
          p.full_name,
          md.hourly_rate,
          md.currency,
          md.experience_description,
          md.session_details
        FROM mentor_details md
        JOIN users u ON md.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE md.mentoring_field_id = ?
        AND u.is_active = true
        ORDER BY md.hourly_rate ASC
      `, [fieldId]);
    } catch (error) {
      console.error('Error in getMentorsByField:', error);
      return [];
    }
  }
}

module.exports = MentorDetailsModel;