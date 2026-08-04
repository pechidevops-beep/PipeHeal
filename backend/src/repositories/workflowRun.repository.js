import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const workflowRunRepository = {
  async findAll({ repositoryId, status, page = 1, limit = 20 } = {}) {
    if (!db) return { data: [], total: 0 };
    const where = {};
    if (repositoryId) where.repositoryId = repositoryId;
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.workflowRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          repository: { select: { fullName: true, owner: true, name: true } },
          _count: { select: { steps: true, incidents: true } },
        },
      }),
      db.workflowRun.count({ where }),
    ]);
    return { data, total };
  },

  async findById(id) {
    if (!db) return null;
    return db.workflowRun.findUnique({
      where: { id },
      include: {
        repository: true,
        steps: { orderBy: { number: 'asc' } },
        incidents: { orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async findByGithubRunId(githubRunId) {
    if (!db) return null;
    return db.workflowRun.findUnique({ where: { githubRunId } });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.workflowRun.create({ data });
  },

  async upsert(githubRunId, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.workflowRun.upsert({
      where: { githubRunId },
      update: data,
      create: { githubRunId, ...data },
    });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.workflowRun.update({ where: { id }, data });
  },

  async createStep(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.pipelineStep.create({ data });
  },

  async upsertStep(githubStepId, workflowRunId, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.pipelineStep.upsert({
      where: {
        // Composite unique would be ideal; using githubStepId + workflowRunId as discriminator
        id: `${githubStepId}-${workflowRunId}`,
      },
      update: data,
      create: { githubStepId, workflowRunId, ...data },
    });
  },
};

export default workflowRunRepository;
