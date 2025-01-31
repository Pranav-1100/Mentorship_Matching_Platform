const { dbAsync } = require('../config/database');

class ExtendedProfileModel {
  static async getByUserId(userId) {
    try {
      const profile = await dbAsync.get(`
        SELECT * FROM extended_profiles WHERE user_id = ?
      `, [userId]);

      if (profile) {
        // Parse JSON fields with error handling
        try {
          profile.education = JSON.parse(profile.education || '[]');
          profile.work_experience = JSON.parse(profile.work_experience || '[]');
          profile.languages = JSON.parse(profile.languages || '[]');
          profile.certificates = JSON.parse(profile.certificates || '[]');
        } catch (e) {
          console.error('Error parsing JSON fields:', e);
          profile.education = [];
          profile.work_experience = [];
          profile.languages = [];
          profile.certificates = [];
        }
      }

      return profile;
    } catch (error) {
      console.error('Error in getByUserId:', error);
      return null;
    }
  }

  static async createOrUpdate(userId, profileData) {
    try {
      const existingProfile = await this.getByUserId(userId);
      
      const {
        age = null,
        photo_url = '',
        location_city = '',
        location_country = '',
        education = [],
        work_experience = [],
        current_company = '',
        current_position = '',
        languages = [],
        timezone = '',
        linkedin_url = '',
        github_url = '',
        website_url = '',
        achievements = '',
        certificates = []
      } = profileData;

      if (existingProfile) {
        await dbAsync.run(`
          UPDATE extended_profiles
          SET age = ?,
              photo_url = ?,
              location_city = ?,
              location_country = ?,
              education = ?,
              work_experience = ?,
              current_company = ?,
              current_position = ?,
              languages = ?,
              timezone = ?,
              linkedin_url = ?,
              github_url = ?,
              website_url = ?,
              achievements = ?,
              certificates = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [
          age, photo_url, location_city, location_country, 
          JSON.stringify(education), JSON.stringify(work_experience),
          current_company, current_position, JSON.stringify(languages),
          timezone, linkedin_url, github_url, website_url,
          achievements, JSON.stringify(certificates), userId
        ]);
      } else {
        await dbAsync.run(`
          INSERT INTO extended_profiles (
            user_id, age, photo_url, location_city, location_country,
            education, work_experience, current_company, current_position,
            languages, timezone, linkedin_url, github_url, website_url,
            achievements, certificates
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, age, photo_url, location_city, location_country,
          JSON.stringify(education), JSON.stringify(work_experience),
          current_company, current_position, JSON.stringify(languages),
          timezone, linkedin_url, github_url, website_url,
          achievements, JSON.stringify(certificates)
        ]);
      }

      return this.getByUserId(userId);
    } catch (error) {
      console.error('Error in createOrUpdate:', error);
      throw error;
    }
  }

  static async getRatings(userId) {
    try {
      return dbAsync.all(`
        SELECT 
          r.*,
          u.email as rater_email,
          p.full_name as rater_name
        FROM user_ratings r
        JOIN users u ON r.rater_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `, [userId]);
    } catch (error) {
      console.error('Error in getRatings:', error);
      return [];
    }
  }

  static async addRating(data) {
    try {
      const { user_id, rater_id, connection_id, rating, review_text } = data;
      
      await dbAsync.run(`
        INSERT INTO user_ratings (
          user_id, rater_id, connection_id, rating, review_text
        ) VALUES (?, ?, ?, ?, ?)
      `, [user_id, rater_id, connection_id, rating, review_text]);

      return this.getRatings(user_id);
    } catch (error) {
      console.error('Error in addRating:', error);
      throw error;
    }
  }
}

module.exports = ExtendedProfileModel;