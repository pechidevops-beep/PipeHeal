import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * User repository — all user-related DB queries.
 */
export const userRepository = {
  async findById(id) {
    if (!db) return null;
    return db.user.findUnique({ where: { id } });
  },

  async findByGithubId(githubId) {
    if (!db) return null;
    return db.user.findUnique({ where: { githubId } });
  },

  async findByLogin(login) {
    if (!db) return null;
    return db.user.findUnique({ where: { login } });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.user.create({ data });
  },

  async upsert(githubId, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.user.upsert({
      where: { githubId },
      update: data,
      create: { githubId, ...data },
    });
  },

  async update(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.user.update({ where: { id }, data });
  },

  async delete(id) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.user.delete({ where: { id } });
  },
};

export default userRepository;
