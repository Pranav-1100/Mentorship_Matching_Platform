const { dbAsync } = require('../config/database');

class UserModel {
  static async create(userData) {
    try {
      console.log('Creating user with data:', userData);
      const { id, email, role } = userData;

      if (!id || !email || !role) {
        throw new Error('Missing required fields: id, email, and role are required');
      }

      const result = await dbAsync.run(
        'INSERT INTO users (id, email, role) VALUES (?, ?, ?)',
        [id, email, role]
      );

      return result;
    } catch (error) {
      console.error('Error in UserModel.create:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      return await dbAsync.get('SELECT * FROM users WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error in UserModel.findById:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      return await dbAsync.get('SELECT * FROM users WHERE email = ?', [email]);
    } catch (error) {
      console.error('Error in UserModel.findByEmail:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { role, is_active } = data;
      return await dbAsync.run(
        'UPDATE users SET role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, is_active, id]
      );
    } catch (error) {
      console.error('Error in UserModel.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      return await dbAsync.run(
        'UPDATE users SET is_active = false WHERE id = ?', 
        [id]
      );
    } catch (error) {
      console.error('Error in UserModel.delete:', error);
      throw error;
    }
  }
}

module.exports = UserModel;