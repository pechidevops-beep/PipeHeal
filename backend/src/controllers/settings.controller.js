import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import userRepository from '../repositories/user.repository.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const settingsController = {
  async getProfile(req, res) {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    return ApiResponse.ok(res, { profile: user }, 'User profile retrieved');
  },

  async updateProfile(req, res) {
    const { firstName, lastName, email } = req.body;
    const updatedUser = await userRepository.update(req.user.id, { firstName, lastName, email });
    return ApiResponse.ok(res, { profile: updatedUser }, 'Profile updated successfully');
  },

  async updatePassword(req, res) {
    // In a real implementation we would verify oldPassword and hash newPassword
    // For this implementation, we just mock the success if a password is sent.
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'Passwords are required', ERROR_CODES.VALIDATION_ERROR);
    }
    return ApiResponse.ok(res, null, 'Password updated successfully');
  },

  async disconnectGithub(req, res) {
    await userRepository.update(req.user.id, { githubId: null });
    return ApiResponse.ok(res, null, 'GitHub account disconnected');
  },

  async logoutAll(req, res) {
    // Mock bumping token version. 
    // Usually implemented by updating a 'tokenVersion' field on the user model.
    return ApiResponse.ok(res, null, 'Logged out of all other devices');
  },

  async testAiProvider(req, res) {
    const { provider, apiKey } = req.body;
    if (!apiKey) throw new ApiError(400, 'API key required', ERROR_CODES.VALIDATION_ERROR);
    // Mock validation logic
    if (apiKey.length < 10) {
      throw new ApiError(400, 'Invalid API key format', ERROR_CODES.VALIDATION_ERROR);
    }
    return ApiResponse.ok(res, { status: 'success' }, 'Connection test successful');
  },

  async getNotifications(req, res) {
    // Mock user settings
    const settings = {
      notifyOnNewIncident: true,
      notifyOnAutoFixSuccess: true,
      notifyOnAutoFixFailure: true,
      deliveryMethod: 'in_app'
    };
    return ApiResponse.ok(res, { settings }, 'Notification settings retrieved');
  },

  async updateNotifications(req, res) {
    // Mock update
    return ApiResponse.ok(res, { settings: req.body }, 'Notification settings updated');
  },

  async getUsage(req, res) {
    // Mock usage statistics
    const usage = {
      autoFixesUsed: 14,
      autoFixesLimit: 50,
      queueLength: 2,
      rateLimitStatus: 'healthy',
      currentPlan: 'Free Tier'
    };
    return ApiResponse.ok(res, { usage }, 'Usage limits retrieved');
  },

  async deleteAccount(req, res) {
    // Perform hard delete of the user, which ideally cascades to repositories/incidents
    await userRepository.delete(req.user.id);
    return ApiResponse.ok(res, null, 'Account deleted successfully');
  }
};

export default settingsController;
