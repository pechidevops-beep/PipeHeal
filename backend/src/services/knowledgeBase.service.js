import knowledgeBaseRepo from '../repositories/knowledgeBase.repository.js';
import { ApiError } from '../utils/ApiError.js';
import crypto from 'crypto';

export const knowledgeBaseService = {
  /**
   * Normalizes an error message to create a consistent signature.
   * This allows matching similar errors even if line numbers or timestamps differ slightly.
   */
  generateErrorSignature(errorMessage) {
    if (!errorMessage) return '';
    // Strip numbers, file paths, and timestamps to get a generic signature
    const genericError = errorMessage
      .replace(/\d+/g, '') // remove numbers
      .replace(/\/[\w./-]+/g, '') // remove file paths
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim()
      .toLowerCase();
    
    return crypto.createHash('sha256').update(genericError).digest('hex');
  },

  async addEntry(repositoryId, errorMessage, rootCause, patchDiff) {
    const errorSignature = this.generateErrorSignature(errorMessage);
    return knowledgeBaseRepo.create({
      repositoryId,
      errorSignature,
      rootCause,
      patchDiff
    });
  },

  async findSimilarFixes(repositoryId, errorMessage) {
    const errorSignature = this.generateErrorSignature(errorMessage);
    return knowledgeBaseRepo.findByErrorSignature(repositoryId, errorSignature);
  },

  async listEntries(repositoryId, page, limit) {
    return knowledgeBaseRepo.findAll(repositoryId, page, limit);
  }
};

export default knowledgeBaseService;
