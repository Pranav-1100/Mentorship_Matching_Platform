const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const NotificationModel = require('../models/notification.model');

class UserService {
  async getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id, data) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await UserModel.update(id, data);
    return this.getUserById(id);
  }

  async deactivateUser(id) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await UserModel.delete(id);
    return true;
  }

  async getAllUsers(filters = {}) {
    try {
      let query = `
        SELECT 
          u.id,
          u.email,
          u.role,
          p.full_name,
          p.bio,
          p.industry,
          p.years_experience,
          GROUP_CONCAT(s.name) as skills
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
        WHERE u.is_active = true
      `;
      const queryParams = [];

      // Add filters
      if (filters.role) {
        query += ` AND (u.role = ? OR u.role = 'both')`;
        queryParams.push(filters.role);
      }

      if (filters.industry) {
        query += ` AND p.industry = ?`;
        queryParams.push(filters.industry);
      }

      if (filters.experience_min) {
        query += ` AND p.years_experience >= ?`;
        queryParams.push(filters.experience_min);
      }

      if (filters.experience_max) {
        query += ` AND p.years_experience <= ?`;
        queryParams.push(filters.experience_max);
      }

      if (filters.search) {
        query += ` AND (p.full_name LIKE ? OR p.bio LIKE ? OR s.name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY u.id ORDER BY p.years_experience DESC`;

      const users = await dbAsync.all(query, queryParams);
      
      // Process skills string into array
      return users.map(user => ({
        ...user,
        skills: user.skills ? user.skills.split(',') : []
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async getUsersByRole(role, filters = {}) {
    try {
      let query = `
        SELECT 
          u.id,
          u.email,
          u.role,
          p.full_name,
          p.bio,
          p.industry,
          p.years_experience,
          p.availability,
          GROUP_CONCAT(s.name) as skills
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
        WHERE u.is_active = true
        AND (u.role = ? OR u.role = 'both')
      `;
      const queryParams = [role];

      if (filters.industry) {
        query += ` AND p.industry = ?`;
        queryParams.push(filters.industry);
      }

      if (filters.experience_min) {
        query += ` AND p.years_experience >= ?`;
        queryParams.push(filters.experience_min);
      }

      if (filters.experience_max) {
        query += ` AND p.years_experience <= ?`;
        queryParams.push(filters.experience_max);
      }

      if (filters.search) {
        query += ` AND (p.full_name LIKE ? OR p.bio LIKE ? OR s.name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY u.id ORDER BY p.years_experience DESC`;

      const users = await dbAsync.all(query, queryParams);
      
      // Process the results
      return users.map(user => ({
        ...user,
        skills: user.skills ? user.skills.split(',') : [],
        availability: user.availability ? JSON.parse(user.availability) : {}
      }));
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  async getUsersByRole(role, filters = {}) {
    try {
      let query = `
        SELECT 
          u.id,
          u.email,
          u.role,
          p.full_name,
          p.bio,
          p.industry,
          p.years_experience,
          p.availability,
          md.hourly_rate,
          md.currency,
          md.experience_description,
          md.session_details,
          mf.name as mentoring_field,
          mf.category as mentoring_field_category,
          GROUP_CONCAT(DISTINCT s.name) as skills
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
        LEFT JOIN mentor_details md ON u.id = md.user_id
        LEFT JOIN mentoring_fields mf ON md.mentoring_field_id = mf.id
        WHERE u.is_active = true
        AND (u.role = ? OR u.role = 'both')
      `;
      const queryParams = [role];

      // Add filters
      if (filters.industry) {
        query += ` AND p.industry = ?`;
        queryParams.push(filters.industry);
      }

      if (filters.mentoring_field) {
        query += ` AND mf.id = ?`;
        queryParams.push(filters.mentoring_field);
      }

      if (filters.min_rate) {
        query += ` AND md.hourly_rate >= ?`;
        queryParams.push(filters.min_rate);
      }

      if (filters.max_rate) {
        query += ` AND md.hourly_rate <= ?`;
        queryParams.push(filters.max_rate);
      }

      if (filters.experience_min) {
        query += ` AND p.years_experience >= ?`;
        queryParams.push(filters.experience_min);
      }

      if (filters.experience_max) {
        query += ` AND p.years_experience <= ?`;
        queryParams.push(filters.experience_max);
      }

      if (filters.search) {
        query += ` AND (p.full_name LIKE ? OR p.bio LIKE ? OR s.name LIKE ? OR md.experience_description LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY u.id`;
      
      if (filters.sort_by === 'rate') {
        query += ` ORDER BY md.hourly_rate ${filters.sort_order || 'ASC'}`;
      } else {
        query += ` ORDER BY p.years_experience DESC`;
      }

      const users = await dbAsync.all(query, queryParams);
      
      return users.map(user => ({
        ...user,
        skills: user.skills ? user.skills.split(',') : [],
        availability: user.availability ? JSON.parse(user.availability) : {},
        mentor_details: user.hourly_rate ? {
          hourly_rate: user.hourly_rate,
          currency: user.currency,
          mentoring_field: user.mentoring_field,
          mentoring_field_category: user.mentoring_field_category,
          experience_description: user.experience_description,
          session_details: user.session_details
        } : null
      }));
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  async getMentoringFields() {
    try {
      return dbAsync.all(`
        SELECT 
          mf.*,
          COUNT(md.id) as mentor_count
        FROM mentoring_fields mf
        LEFT JOIN mentor_details md ON mf.id = md.mentoring_field_id
        GROUP BY mf.id
        ORDER BY mf.category, mf.name
      `);
    } catch (error) {
      console.error('Error getting mentoring fields:', error);
      throw error;
    }
  }

}

module.exports = new UserService();
