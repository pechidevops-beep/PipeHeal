import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Repository model — DB queries for tracked GitHub repos.
 */
export const repositoryRepository = {
  async findAll(userId, { page = 1, limit = 20 } = {}) {
    if (!db) return { data: [], total: 0 };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.repository.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { incidents: true, workflowRuns: true } } },
      }),
      db.repository.count({ where: { userId } }),
    ]);
    return { data, total };
  },

  async findById(id, userId) {
    if (!db) return null;
    return db.repository.findFirst({
      where: { id, userId },
      include: {
        workflowRuns: { take: 5, orderBy: { createdAt: 'desc' } },
        incidents: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: true,
      },
    });
  },

  async findByFullName(fullName) {
    if (!db) return null;
    return db.repository.findUnique({ where: { fullName }, include: { user: true } });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.repository.create({ data });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.repository.update({ where: { id }, data });
  },

  async delete(id, userId) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.repository.deleteMany({ where: { id, userId } });
  },
};

export default repositoryRepository;
