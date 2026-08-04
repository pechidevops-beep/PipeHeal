import { db } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const diagnosisRepository = {
  async findByIncidentId(incidentId) {
    if (!db) return [];
    return db.diagnosis.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.diagnosis.create({ data });
  },

  async createPatch(data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.patch.create({ data });
  },

  async findPatchesByIncident(incidentId) {
    if (!db) return [];
    return db.patch.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updatePatch(id, data) {
    if (!db) throw ApiError.serviceUnavailable('Database');
    return db.patch.update({ where: { id }, data });
  },
};

export default diagnosisRepository;
