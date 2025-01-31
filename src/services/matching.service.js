const { dbAsync } = require('../config/database');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const SkillModel = require('../models/skill.model');

class MatchingService {
  async findMatches(userId) {
    try {
      // Get user data
      const user = await UserModel.findById(userId);
      const userProfile = await ProfileModel.findByUserId(userId);
      const userSkills = await SkillModel.getUserSkills(userId);

      if (!user || !userProfile) {
        throw new Error('User profile not found');
      }

      let potentialMatches = [];

      // Find matches based on user role
      switch (user.role) {
        case 'mentee':
          potentialMatches = await this.findMentors(userProfile, userSkills);
          break;
        case 'mentor':
          potentialMatches = await this.findMentees(userProfile, userSkills);
          break;
        case 'both':
          const mentors = await this.findMentors(userProfile, userSkills);
          const mentees = await this.findMentees(userProfile, userSkills);
          potentialMatches = {
            asMentee: mentors,
            asMentor: mentees
          };
          break;
      }

      return potentialMatches;
    } catch (error) {
      console.error('Error in findMatches:', error);
      throw error;
    }
  }

  async findMentors(userProfile, userSkills) {
    const query = `
      SELECT u.id, u.email, u.role, p.*, 
             GROUP_CONCAT(DISTINCT s.name) as skill_names,
             COUNT(DISTINCT s.id) as matching_skills_count
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE (u.role = 'mentor' OR u.role = 'both')
      AND u.is_active = true
      AND p.years_experience > ?
      AND u.id != ?
      GROUP BY u.id
      ORDER BY matching_skills_count DESC, p.years_experience DESC
      LIMIT 20
    `;

    const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
    return this.calculateMatchScores(mentors, userProfile, userSkills);
  }

  async findMentees(userProfile, userSkills) {
    const query = `
      SELECT u.id, u.email, u.role, p.*, 
             GROUP_CONCAT(DISTINCT s.name) as skill_names,
             COUNT(DISTINCT s.id) as matching_skills_count
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE (u.role = 'mentee' OR u.role = 'both')
      AND u.is_active = true
      AND p.years_experience < ?
      AND u.id != ?
      GROUP BY u.id
      ORDER BY matching_skills_count DESC
      LIMIT 20
    `;

    const mentees = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
    return this.calculateMatchScores(mentees, userProfile, userSkills);
  }

  calculateMatchScores(matches, userProfile, userSkills) {
    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));

    return matches.map(match => {
      const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
      const skillMatchCount = matchSkills.filter(skill => 
        userSkillNames.has(skill.toLowerCase())
      ).length;

      const experienceScore = Math.min(100, 
        Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
        Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
      );

      const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);

      const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);

      return {
        userId: match.id,
        fullName: match.full_name,
        role: match.role,
        industry: match.industry,
        yearsExperience: match.years_experience,
        skills: matchSkills,
        matchScore: Math.round(totalScore),
        matchDetails: {
          skillScore: Math.round(skillScore),
          experienceScore: Math.round(experienceScore)
        }
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  async updatePreferences(userId, preferences) {
    const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;

    await dbAsync.run(`
      INSERT OR REPLACE INTO matching_preferences 
      (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      JSON.stringify(preferred_industries),
      min_experience,
      max_experience,
      preferred_meeting_frequency
    ]);

    return this.getPreferences(userId);
  }

  async getPreferences(userId) {
    const prefs = await dbAsync.get(
      'SELECT * FROM matching_preferences WHERE user_id = ?',
      [userId]
    );

    if (!prefs) {
      return {
        preferred_industries: [],
        min_experience: 0,
        max_experience: 999,
        preferred_meeting_frequency: 'weekly'
      };
    }

    return {
      ...prefs,
      preferred_industries: JSON.parse(prefs.preferred_industries)
    };
  }
}

module.exports = new MatchingService();
