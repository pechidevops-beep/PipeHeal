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

  async findByEmail(email) {
    if (!db) return null;
    return db.user.findUnique({ where: { email } });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    try {
      return await db.user.create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ApiError(409, 'A user with this email or github account already exists.', 'P2002');
      }
      throw error;
    }
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
    try {
      return await db.user.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ApiError(409, 'Unique constraint failed on update.', 'P2002');
      }
      throw error;
    }
  },

  async delete(id) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.user.delete({ where: { id } });
  },
};

export default userRepository;
