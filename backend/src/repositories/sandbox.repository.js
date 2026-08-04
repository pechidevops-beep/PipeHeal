import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const sandboxRepository = {
  async findByIncidentId(incidentId) {
    if (!db) return [];
    return db.sandboxRun.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id) {
    if (!db) return null;
    return db.sandboxRun.findUnique({ where: { id } });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.sandboxRun.create({ data });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.sandboxRun.update({ where: { id }, data });
  },
};

export const pullRequestRepository = {
  async findByIncidentId(incidentId) {
    if (!db) return [];
    return db.pullRequest.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.pullRequest.create({ data });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.pullRequest.update({ where: { id }, data });
  },
};

export const activityRepository = {
  async create(data) {
    if (!db) return null;
    return db.activity.create({ data }).catch(() => null); // non-critical
  },

  async findRecent(limit = 20) {
    if (!db) return [];
    return db.activity.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { login: true, avatarUrl: true } },
        incident: { select: { title: true, status: true } },
      },
    });
  },
};
