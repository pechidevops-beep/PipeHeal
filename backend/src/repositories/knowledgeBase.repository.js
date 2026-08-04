import { db } from '../config/prisma.js';

export const knowledgeBaseRepo = {
  async findByErrorSignature(repositoryId, errorSignature) {
    if (!db) return [];
    return db.knowledgeBase.findMany({
      where: { repositoryId, errorSignature },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  },

  async create(data) {
    if (!db) return null;
    return db.knowledgeBase.create({ data });
  },

  async findAll(repositoryId, page = 1, limit = 20) {
    if (!db) return { data: [], total: 0 };
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      db.knowledgeBase.findMany({
        where: { repositoryId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.knowledgeBase.count({ where: { repositoryId } }),
    ]);
    
    return { data, total };
  }
};

export default knowledgeBaseRepo;
