const { dbAsync } = require('../config/database');

class SkillModel {
  static async findOrCreate(name, category) {
    try {
      let skill = await dbAsync.get('SELECT * FROM skills WHERE name = ?', [name]);
      
      if (!skill) {
        const result = await dbAsync.run(
          'INSERT INTO skills (name, category) VALUES (?, ?)',
          [name, category]
        );
        skill = { id: result.id, name, category };
      }
      
      return skill;
    } catch (error) {
      console.error('Error in findOrCreate skill:', error);
      throw error;
    }
  }

  static async addUserSkill(userId, skillId, proficiencyLevel) {
    try {
      // First, remove existing skill if it exists
      await dbAsync.run(
        'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
        [userId, skillId]
      );

      // Then add the new skill
      return dbAsync.run(
        'INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
        [userId, skillId, proficiencyLevel]
      );
    } catch (error) {
      console.error('Error in addUserSkill:', error);
      throw error;
    }
  }

  static async getUserSkills(userId) {
    try {
      return dbAsync.all(`
        SELECT s.*, us.proficiency_level
        FROM skills s
        JOIN user_skills us ON s.id = us.skill_id
        WHERE us.user_id = ?
      `, [userId]);
    } catch (error) {
      console.error('Error in getUserSkills:', error);
      return [];
    }
  }

  static async removeUserSkill(userId, skillId) {
    try {
      return dbAsync.run(
        'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
        [userId, skillId]
      );
    } catch (error) {
      console.error('Error in removeUserSkill:', error);
      throw error;
    }
  }

  static async getAllSkills() {
    try {
      return dbAsync.all('SELECT * FROM skills ORDER BY name');
    } catch (error) {
      console.error('Error in getAllSkills:', error);
      return [];
    }
  }
}

module.exports = SkillModel;