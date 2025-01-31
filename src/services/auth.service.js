const admin = require('../config/firebase');
const { dbAsync } = require('../config/database');
const { generateToken } = require('../utils/jwt.utils');
const { ValidationError, AuthenticationError } = require('../utils/errors');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const ExtendedProfileModel = require('../models/extended.profile.model');

class AuthService {
  async registerUser(userData) {
    try {
      console.log('Registration data received:', JSON.stringify(userData, null, 2));
      
      const { 
        email, 
        password, 
        role,
        full_name,
        bio,
        industry,
        years_experience,
        current_company,
        current_position,
        education = [],
        work_experience = [],
        languages = [],
        location_city,
        location_country,
        photo_url,
        linkedin_url,
        github_url,
        website_url,
        preferred_learning_style,
        timezone,
        availability = {},
        hourly_rate,
        skills = [],
        interests = [],
        career_goals = [],
        certificates = [],
        project_portfolio = []
      } = userData;

      // Validate required fields
      if (!email || !password || !role) {
        console.error('Missing required fields:', { email: !!email, password: !!password, role: !!role });
        throw new ValidationError('Email, password, and role are required');
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Create user in Firebase
      console.log('Creating Firebase user...');
      const firebaseUser = await admin.auth().createUser({
        email,
        password,
        emailVerified: false
      });
      console.log('Firebase user created:', firebaseUser.uid);

      // Create user in our database
      console.log('Creating user in database...');
      await UserModel.create({
        id: firebaseUser.uid,
        email: email,
        role: role
      });

      // Create complete profile
      console.log('Creating profile...');
      await ProfileModel.create({
        user_id: firebaseUser.uid,
        full_name,
        bio,
        industry,
        years_experience,
        availability,
        current_company,
        current_position,
        education,
        work_experience,
        languages,
        location_city,
        location_country,
        photo_url,
        linkedin_url,
        github_url,
        website_url,
        preferred_learning_style,
        timezone,
        interests,
        career_goals,
        certificates,
        project_portfolio
      });

      // Generate JWT token
      const token = generateToken(firebaseUser.uid);

      console.log('Registration completed successfully');
      return {
        user: {
          id: firebaseUser.uid,
          email: email,
          role: role,
          profile: {
            full_name,
            bio,
            industry,
            years_experience,
            current_company,
            current_position,
            location_city,
            location_country
          }
        },
        token
      };
    } catch (error) {
      console.error('Error in registerUser:', error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.code === 'auth/email-already-exists') {
        throw new ValidationError('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   */
  async loginUser(email, password) {
    try {
      // First verify with Firebase
      const signInResult = await admin.auth().getUserByEmail(email);
      
      // Get user from our database
      const user = await UserModel.findById(signInResult.uid);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (!user.is_active) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Generate JWT token
      const token = generateToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new AuthenticationError('Invalid email or password');
      }
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   */
  async verifyToken(token) {
    try {
      // Verify JWT token
      const decoded = verifyToken(token);

      // Get user from database
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (!user.is_active) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify with Firebase
      await admin.auth().getUser(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User's ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Update password in Firebase
      await admin.auth().updateUser(userId, {
        password: newPassword
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        throw new ValidationError('Current password is incorrect');
      }
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User's email
   */
  async forgotPassword(email) {
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return { message: 'If an account exists, a password reset email has been sent' };
      }

      // Send password reset email through Firebase
      await admin.auth().generatePasswordResetLink(email);

      return { message: 'If an account exists, a password reset email has been sent' };
    } catch (error) {
      // Log error but don't reveal if email exists
      console.error('Password reset error:', error);
      return { message: 'If an account exists, a password reset email has been sent' };
    }
  }

  /**
   * Logout user
   * @param {string} userId - User's ID
   */
  async logoutUser(userId) {
    try {
      // Revoke Firebase refresh tokens
      await admin.auth().revokeRefreshTokens(userId);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Error logging out user');
    }
  }

  /**
   * Verify email
   * @param {string} token - Email verification token
   */
  async verifyEmail(token) {
    try {
      // Verify email through Firebase
      const email = await admin.auth().verifyIdToken(token);
      
      // Update user in database
      await dbAsync.run(
        'UPDATE users SET email_verified = true WHERE email = ?',
        [email]
      );

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new ValidationError('Invalid verification token');
    }
  }
}

module.exports = new AuthService();
