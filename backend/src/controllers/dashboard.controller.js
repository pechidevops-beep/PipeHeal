import dashboardService from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const dashboardController = {
  async getDashboard(req, res) {
    const userId = req.user.id;

    const [stats, activity] = await Promise.all([
      dashboardService.getOverviewStats(userId),
      dashboardService.getRecentActivity(userId, 20),
    ]);

    return ApiResponse.ok(res, { stats, activity }, 'Dashboard data retrieved');
  }
};

export default dashboardController;
