import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const incidentRepository = {
  async findAll({ userId, repositoryId, status, severity, page = 1, limit = 20 } = {}) {
    if (!db) return { data: [], total: 0 };
    const where = {};
    if (repositoryId) where.repositoryId = repositoryId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (userId) where.repository = { userId };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          repository: { select: { fullName: true, owner: true, name: true } },
          workflowRun: { select: { workflowName: true, headBranch: true } },
          _count: { select: { diagnoses: true, patches: true, sandboxRuns: true } },
        },
      }),
      db.incident.count({ where }),
    ]);
    return { data, total };
  },

  async findById(id) {
    if (!db) return null;
    return db.incident.findUnique({
      where: { id },
      include: {
        repository: true,
        workflowRun: { include: { steps: true } },
        diagnoses: { orderBy: { createdAt: 'desc' } },
        patches: { orderBy: { createdAt: 'desc' } },
        sandboxRuns: { orderBy: { createdAt: 'desc' } },
        pullRequests: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.incident.create({ data });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.incident.update({ where: { id }, data });
  },

  async countByStatus(repositoryId) {
    if (!db) return {};
    const counts = await db.incident.groupBy({
      by: ['status'],
      where: { repositoryId },
      _count: { status: true },
    });
    return counts.reduce((acc, { status, _count }) => {
      acc[status] = _count.status;
      return acc;
    }, {});
  },
};

export default incidentRepository;
