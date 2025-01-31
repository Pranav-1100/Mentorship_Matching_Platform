const ProfileModel = require('../models/profile.model');
const ExtendedProfileModel = require('../models/extended.profile.model');
const MentorDetailsModel = require('../models/mentor.details.model');
const SkillModel = require('../models/skill.model');
const { ValidationError } = require('../utils/errors');

class ProfileService {
  async getProfileByUserId(userId) {
    try {
      // Get the basic profile first
      const profile = await ProfileModel.findByUserId(userId);
      let profileData = {};

      if (profile) {
        profileData = {
          ...profile,
          availability: typeof profile.availability === 'string' 
            ? JSON.parse(profile.availability || '{}') 
            : (profile.availability || {})
        };
      }

      // Get extended profile
      let extendedProfile = await ExtendedProfileModel.getByUserId(userId);
      if (extendedProfile) {
        try {
          extendedProfile = {
            ...extendedProfile,
            education: typeof extendedProfile.education === 'string' 
              ? JSON.parse(extendedProfile.education || '[]') 
              : (extendedProfile.education || []),
            work_experience: typeof extendedProfile.work_experience === 'string'
              ? JSON.parse(extendedProfile.work_experience || '[]')
              : (extendedProfile.work_experience || []),
            languages: typeof extendedProfile.languages === 'string'
              ? JSON.parse(extendedProfile.languages || '[]')
              : (extendedProfile.languages || []),
            certificates: typeof extendedProfile.certificates === 'string'
              ? JSON.parse(extendedProfile.certificates || '[]')
              : (extendedProfile.certificates || [])
          };
        } catch (e) {
          console.error('Error parsing extended profile JSON:', e);
        }
      }

      // Get mentor details
      const mentorDetails = await MentorDetailsModel.getByUserId(userId);

      // Get skills
      const skills = await SkillModel.getUserSkills(userId);

      // If no profile exists at all, return default structure
      if (!profile && !extendedProfile && !mentorDetails) {
        return {
          user_id: userId,
          full_name: '',
          bio: '',
          industry: '',
          years_experience: 0,
          availability: {},
          current_company: '',
          current_position: '',
          education: [],
          work_experience: [],
          languages: [],
          location_city: '',
          location_country: '',
          photo_url: '',
          linkedin_url: '',
          github_url: '',
          website_url: '',
          preferred_learning_style: '',
          timezone: '',
          skills: [],
          hourly_rate: '',
          is_profile_created: false
        };
      }

      // Combine all profile data
      return {
        ...profileData,
        ...(extendedProfile || {}),
        ...(mentorDetails || {}),
        skills: skills || [],
        is_profile_created: Boolean(profile)
      };
    } catch (error) {
      console.error('Error in getProfileByUserId:', error);
      throw error;
    }
  }

  async upsertProfile(userId, profileData) {
    try {
      console.log('Upserting profile data:', { userId, profileData });

      // Split data for different tables
      const profileFields = {
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        industry: profileData.industry || '',
        years_experience: profileData.years_experience || 0,
        availability: JSON.stringify(profileData.availability || {})
      };

      const extendedProfileFields = {
        current_company: profileData.current_company || '',
        current_position: profileData.current_position || '',
        education: profileData.education || [],
        work_experience: profileData.work_experience || [],
        languages: profileData.languages || [],
        location_city: profileData.location_city || '',
        location_country: profileData.location_country || '',
        photo_url: profileData.photo_url || '',
        linkedin_url: profileData.linkedin_url || '',
        github_url: profileData.github_url || '',
        website_url: profileData.website_url || '',
        preferred_learning_style: profileData.preferred_learning_style || '',
        timezone: profileData.timezone || ''
      };

      console.log('Profile fields to update:', profileFields);

      // Update or create main profile
      const existingProfile = await ProfileModel.findByUserId(userId);
      if (existingProfile) {
        await ProfileModel.update(userId, profileFields);
      } else {
        await ProfileModel.create({ ...profileFields, user_id: userId });
      }

      // Update extended profile
      await ExtendedProfileModel.createOrUpdate(userId, extendedProfileFields);

      // Update mentor details if provided
      if (profileData.hourly_rate) {
        await MentorDetailsModel.createOrUpdate(userId, {
          hourly_rate: profileData.hourly_rate,
          currency: 'USD'
        });
      }

      // Update skills if provided
      if (profileData.skills && Array.isArray(profileData.skills)) {
        await this.updateUserSkills(userId, profileData.skills);
      }

      return this.getProfileByUserId(userId);
    } catch (error) {
      console.error('Error in upsertProfile:', error);
      throw new ValidationError('Failed to update profile: ' + error.message);
    }
  }

  async getUserSkills(userId) {
    try {
      const skills = await SkillModel.getUserSkills(userId);
      return skills || [];
    } catch (error) {
      console.error('Error in getUserSkills:', error);
      return [];
    }
  }

  async updateUserSkills(userId, skills) {
    try {
      const skillPromises = skills.map(async (skill) => {
        const savedSkill = await SkillModel.findOrCreate(
          skill.name || '',
          skill.category || 'Other'
        );
        await SkillModel.addUserSkill(
          userId,
          savedSkill.id,
          skill.proficiency_level || 1
        );
        return savedSkill;
      });

      await Promise.all(skillPromises);
      return this.getUserSkills(userId);
    } catch (error) {
      console.error('Error in updateUserSkills:', error);
      throw new ValidationError('Failed to update skills. Please check the input format.');
    }
  }

  async getPublicProfile(userId) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile.is_profile_created) {
      throw new ValidationError('Profile not found');
    }
    const { availability, is_profile_created, ...publicProfile } = profile;
    return publicProfile;
  }
}

module.exports = new ProfileService();