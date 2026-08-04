import { ApiResponse } from '../utils/ApiResponse.js';
import { db } from '../config/prisma.js';

export const activityController = {
  async getActivities(req, res) {
    const { page = 1, limit = 50 } = req.query;
    
    // Convert to integers and validate
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch activities ordered by newest first
    const [activities, total] = await Promise.all([
      db.activity.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          workflowRun: { select: { workflowName: true, headBranch: true, status: true, headSha: true } },
          incident: { select: { title: true, status: true } },
        }
      }),
      db.activity.count()
    ]);

    return ApiResponse.ok(res, {
      data: activities,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }, 'Activities retrieved');
  }
};

export default activityController;
