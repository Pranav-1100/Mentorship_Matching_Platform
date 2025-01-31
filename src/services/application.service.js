const ApplicationModel = require('../models/application.model');
const ConnectionModel = require('../models/connection.model');
const NotificationService = require('./notification.service');
const { ValidationError, AuthorizationError } = require('../utils/errors');

class ApplicationService {
  async createApplication(menteeId, mentorId, message) {
    try {
      // Validate users exist and roles
      const [mentor, mentee] = await Promise.all([
        UserModel.findById(mentorId),
        UserModel.findById(menteeId)
      ]);

      if (!mentor || !mentee) {
        throw new ValidationError('Invalid mentor or mentee ID');
      }

      if (!['mentor', 'both'].includes(mentor.role)) {
        throw new ValidationError('Target user cannot be a mentor based on their role');
      }

      if (!['mentee', 'both'].includes(mentee.role)) {
        throw new ValidationError('You cannot be a mentee based on your role');
      }

      // Create application
      const application = await ApplicationModel.create({
        mentor_id: mentorId,
        mentee_id: menteeId,
        message
      });

      // Send notification to mentor
      await NotificationService.createNotification(
        mentorId,
        'application_received',
        `New mentorship application from ${mentee.email}`
      );

      return application;
    } catch (error) {
      console.error('Error in createApplication:', error);
      throw error;
    }
  }

  async getUserApplications(userId) {
    try {
      const applications = await ApplicationModel.getUserApplications(userId);
      return this.formatApplicationsResponse(applications, userId);
    } catch (error) {
      console.error('Error in getUserApplications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId, userId, status) {
    try {
      const application = await ApplicationModel.findById(applicationId);
      if (!application) {
        throw new ValidationError('Application not found');
      }

      if (application.mentor_id !== userId) {
        throw new AuthorizationError('Not authorized to update this application');
      }

      await ApplicationModel.updateStatus(applicationId, status);

      // If accepted, create a connection
      if (status === 'accepted') {
        await ConnectionModel.create(application.mentor_id, application.mentee_id);
      }

      // Notify mentee
      await NotificationService.createNotification(
        application.mentee_id,
        `application_${status}`,
        `Your mentorship application has been ${status}`
      );

      return ApplicationModel.findById(applicationId);
    } catch (error) {
      console.error('Error in updateApplicationStatus:', error);
      throw error;
    }
  }

  async cancelApplication(applicationId, userId) {
    try {
      const application = await ApplicationModel.findById(applicationId);
      if (!application) {
        throw new ValidationError('Application not found');
      }

      if (application.mentee_id !== userId) {
        throw new AuthorizationError('Not authorized to cancel this application');
      }

      await ApplicationModel.delete(applicationId);

      // Notify mentor
      await NotificationService.createNotification(
        application.mentor_id,
        'application_cancelled',
        'A mentorship application has been cancelled'
      );

      return { success: true };
    } catch (error) {
      console.error('Error in cancelApplication:', error);
      throw error;
    }
  }

  formatApplicationsResponse(applications, currentUserId) {
    return applications.map(app => ({
      id: app.id,
      mentor: {
        id: app.mentor_id,
        name: app.mentor_id === currentUserId ? 'You' : app.other_user_name,
        avatar: app.mentor_id === currentUserId ? null : app.other_user_avatar,
        position: app.mentor_id === currentUserId ? null : app.other_user_position,
        company: app.mentor_id === currentUserId ? null : app.other_user_company
      },
      status: app.status,
      message: app.message,
      created_at: app.created_at,
      updated_at: app.updated_at
    }));
  }
}

module.exports = new ApplicationService();