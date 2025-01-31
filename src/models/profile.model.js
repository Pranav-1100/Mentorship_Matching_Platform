const { dbAsync } = require('../config/database');

class ProfileModel {
  static async create(profileData) {
    try {
      console.log('Creating profile with data:', profileData);
      const {
        user_id,
        full_name = '',
        bio = '',
        industry = '',
        years_experience = 0,
        availability = {},
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
        certificates = [],
        interests = [],
        career_goals = [],
        project_portfolio = [],
        preferred_learning_style = ''
      } = profileData;

      if (!user_id) {
        throw new Error('user_id is required');
      }

      const result = await dbAsync.run(
        `INSERT INTO profiles (
          user_id, full_name, bio, industry, years_experience, availability,
          age, photo_url, location_city, location_country, education,
          work_experience, current_company, current_position, languages,
          timezone, linkedin_url, github_url, website_url, achievements,
          certificates, interests, career_goals, project_portfolio,
          preferred_learning_style
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          full_name,
          bio,
          industry,
          years_experience,
          JSON.stringify(availability),
          age,
          photo_url,
          location_city,
          location_country,
          JSON.stringify(education),
          JSON.stringify(work_experience),
          current_company,
          current_position,
          JSON.stringify(languages),
          timezone,
          linkedin_url,
          github_url,
          website_url,
          achievements,
          JSON.stringify(certificates),
          JSON.stringify(interests),
          JSON.stringify(career_goals),
          JSON.stringify(project_portfolio),
          preferred_learning_style
        ]
      );

      console.log('Profile created successfully');
      return result;
    } catch (error) {
      console.error('Error in ProfileModel.create:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      // Join with users table to get role
      const profile = await dbAsync.get(
        `SELECT p.*, u.role, u.email 
         FROM profiles p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = ?`, 
        [userId]
      );
      
      if (profile) {
        try {
          // Parse all JSON fields
          profile.availability = JSON.parse(profile.availability || '{}');
          profile.education = JSON.parse(profile.education || '[]');
          profile.work_experience = JSON.parse(profile.work_experience || '[]');
          profile.languages = JSON.parse(profile.languages || '[]');
          profile.certificates = JSON.parse(profile.certificates || '[]');
          profile.interests = JSON.parse(profile.interests || '[]');
          profile.career_goals = JSON.parse(profile.career_goals || '[]');
          profile.project_portfolio = JSON.parse(profile.project_portfolio || '[]');
        } catch (e) {
          console.error('Error parsing JSON fields:', e);
        }
      }
      
      return profile;
    } catch (error) {
      console.error('Error in ProfileModel.findByUserId:', error);
      throw error;
    }
  }

  static async update(userId, data) {
    try {
      const {
        full_name,
        bio,
        industry,
        years_experience,
        availability,
        age,
        photo_url,
        location_city,
        location_country,
        education,
        work_experience,
        current_company,
        current_position,
        languages,
        timezone,
        linkedin_url,
        github_url,
        website_url,
        achievements,
        certificates,
        interests,
        career_goals,
        project_portfolio,
        preferred_learning_style
      } = data;

      const result = await dbAsync.run(
        `UPDATE profiles 
         SET full_name = ?,
             bio = ?,
             industry = ?,
             years_experience = ?,
             availability = ?,
             age = ?,
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
             interests = ?,
             career_goals = ?,
             project_portfolio = ?,
             preferred_learning_style = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          full_name || '',
          bio || '',
          industry || '',
          years_experience || 0,
          JSON.stringify(availability || {}),
          age || null,
          photo_url || '',
          location_city || '',
          location_country || '',
          JSON.stringify(education || []),
          JSON.stringify(work_experience || []),
          current_company || '',
          current_position || '',
          JSON.stringify(languages || []),
          timezone || '',
          linkedin_url || '',
          github_url || '',
          website_url || '',
          achievements || '',
          JSON.stringify(certificates || []),
          JSON.stringify(interests || []),
          JSON.stringify(career_goals || []),
          JSON.stringify(project_portfolio || []),
          preferred_learning_style || '',
          userId
        ]
      );

      // Return updated profile with role
      return this.findByUserId(userId);
    } catch (error) {
      console.error('Error in ProfileModel.update:', error);
      throw error;
    }
  }
}

module.exports = ProfileModel;