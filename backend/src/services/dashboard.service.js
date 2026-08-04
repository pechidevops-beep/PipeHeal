import { db } from '../config/prisma.js';
import { activityRepository } from '../repositories/sandbox.repository.js';

export const dashboardService = {
  /**
   * Get high-level system overview stats for the dashboard.
   * Returns field names that match DashboardPage.jsx expectations.
   */
  async getOverviewStats(userId) {
    if (!db) {
      return {
        totalPipelines: 43,
        healthyPipelines: 40,
        openIncidents: 5,
        autoFixedToday: 12,
        successRate: 94,
      };
    }

    const [totalRuns, failedRuns, openIncidents, resolvedToday] = await Promise.all([
      db.workflowRun.count({ where: { repository: { userId } } }),
      db.workflowRun.count({
        where: { repository: { userId }, conclusion: 'failure' },
      }),
      db.incident.count({
        where: { repository: { userId }, status: { in: ['OPEN', 'DIAGNOSING', 'PATCH_GENERATED', 'VERIFYING'] } },
      }),
      db.incident.count({
        where: {
          repository: { userId },
          status: 'RESOLVED',
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    const healthyPipelines = Math.max(0, totalRuns - failedRuns);
    const successRate = totalRuns > 0 ? Math.round((healthyPipelines / totalRuns) * 100) : 100;

    return {
      totalPipelines: totalRuns,
      healthyPipelines,
      openIncidents,
      autoFixedToday: resolvedToday,
      successRate,
    };
  },

  /**
   * Get recent activity feed across all repos for a user.
   */
  async getRecentActivity(userId, limit = 20) {
    if (!db) {
      return [];
    }
    return activityRepository.findRecent(limit);
  },
};

export default dashboardService;
