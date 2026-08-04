import repositoryRepo from '../repositories/repository.repository.js';
import githubService from './github.service.js';
import { db } from '../config/prisma.js';
import { emitToAll } from '../socket/handlers.js';
import { SOCKET_NAMESPACES } from '../constants/events.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import ERROR_CODES from '../constants/errorCodes.js';

/**
 * Constructs the webhook URL for this PipeHeal instance.
 */
function getWebhookUrl() {
  const base = env.WEBHOOK_BASE_URL || `http://localhost:${env.PORT}`;
  return `${base}/api/v1/github/webhook`;
}

export const repositoryService = {
  async listRepositories(userId, page, limit) {
    return repositoryRepo.findAll(userId, { page, limit });
  },

  async getRepository(id, userId) {
    const repo = await repositoryRepo.findById(id, userId);
    if (!repo) throw new ApiError(404, 'Repository not found', ERROR_CODES.NOT_FOUND);
    return repo;
  },

  /**
   * Lists the user's GitHub repositories via the GitHub API.
   * Requires the user's GitHub access token.
   */
  async listGithubRepositories(userId, page = 1, limit = 100, sort = 'updated', direction = 'desc') {
    // Fetch user from DB to get access token
    const user = await db.user.findUnique({ where: { id: userId }, select: { accessToken: true } });
    if (!user?.accessToken) {
      // In dev mode without real OAuth, return empty list
      logger.warn('[Repository] No GitHub token for user — returning empty GitHub repo list');
      return [];
    }
    return githubService.listRepositories(user.accessToken, page, limit, sort, direction);
  },

  /**
   * Adds a repository to PipeHeal tracking.
   * 1. Verifies it exists on GitHub
   * 2. Saves to DB
   * 3. Creates a GitHub webhook (best-effort)
   */
  async addRepository(userId, repoData, githubToken) {
    const [owner, name] = repoData.fullName.split('/');
    if (!owner || !name) {
      throw new ApiError(400, 'Invalid repository fullName format. Expected: owner/repo', ERROR_CODES.VALIDATION_ERROR);
    }

    // Check if already tracked
    const existing = await repositoryRepo.findByFullName(repoData.fullName);
    if (existing) {
      throw new ApiError(409, 'Repository already tracked', ERROR_CODES.ALREADY_EXISTS);
    }

    // Verify exists on GitHub (if we have a token)
    let ghRepo = null;
    if (githubToken) {
      try {
        ghRepo = await githubService.getRepository(owner, name, githubToken);
      } catch (err) {
        logger.warn(`[Repository] Could not verify GitHub repo: ${err.message}`);
      }
    }

    // Save to DB
    const repo = await repositoryRepo.create({
      githubId: ghRepo?.id || Math.floor(Math.random() * 9999999), // fallback for dev
      owner,
      name,
      fullName: repoData.fullName,
      description: repoData.description || ghRepo?.description || null,
      private: repoData.private ?? ghRepo?.private ?? false,
      defaultBranch: repoData.defaultBranch || ghRepo?.default_branch || 'main',
      language: repoData.language || ghRepo?.language || null,
      userId,
    });

    // Create GitHub webhook (best-effort — don't fail if this fails)
    if (githubToken) {
      try {
        const webhookUrl = getWebhookUrl();
        const webhook = await githubService.createWebhook(
          owner,
          name,
          webhookUrl,
          env.GITHUB_WEBHOOK_SECRET,
          githubToken
        );
        if (webhook?.id) {
          await repositoryRepo.update(repo.id, {
            webhookId: webhook.id,
            webhookActive: true,
          });
          repo.webhookId = webhook.id;
          repo.webhookActive = true;
        }
      } catch (err) {
        logger.warn(`[Repository] Webhook creation failed (non-fatal): ${err.message}`);
      }
    }

    // Emit real-time event
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'repository_connected', repo);

    // Activity log
    await db.activity.create({
      data: {
        eventType: 'repository_connected',
        title: 'Repository Connected',
        description: `${repoData.fullName} is now tracked by PipeHeal.`,
        userId,
      },
    });

    return repo;
  },

  /**
   * Removes a repository from PipeHeal tracking and deletes its webhook.
   */
  async removeRepository(id, userId) {
    const repo = await this.getRepository(id, userId);

    // Delete GitHub webhook (best-effort)
    if (repo.webhookId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { accessToken: true } });
      if (user?.accessToken) {
        try {
          await githubService.deleteWebhook(repo.owner, repo.name, repo.webhookId, user.accessToken);
        } catch (err) {
          logger.warn(`[Repository] Could not delete webhook ${repo.webhookId}: ${err.message}`);
        }
      }
    }

    await repositoryRepo.delete(id, userId);

    // Emit real-time event
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'repository_removed', { id, fullName: repo.fullName });

    // Activity log
    await db.activity.create({
      data: {
        eventType: 'repository_removed',
        title: 'Repository Removed',
        description: `${repo.fullName} has been removed from PipeHeal.`,
        userId,
      },
    });

    return true;
  },

  /**
   * Syncs a repository's metadata from GitHub (updates branch, visibility, etc.)
   */
  async syncRepository(id, userId) {
    const repo = await this.getRepository(id, userId);
    const user = await db.user.findUnique({ where: { id: userId }, select: { accessToken: true } });

    if (!user?.accessToken) {
      throw new ApiError(400, 'GitHub token required for sync', ERROR_CODES.UNAUTHORIZED);
    }

    const ghRepo = await githubService.syncRepository(repo.owner, repo.name, user.accessToken);

    const updated = await repositoryRepo.update(id, {
      defaultBranch: ghRepo.default_branch,
      private: ghRepo.private,
      description: ghRepo.description,
      language: ghRepo.language,
    });

    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'repository_synced', updated);

    await db.activity.create({
      data: {
        eventType: 'repository_synced',
        title: 'Repository Synced',
        description: `${repo.fullName} metadata refreshed from GitHub.`,
        userId,
      },
    });

    return updated;
  },

  /**
   * Toggles the Auto-Fix feature for a repository.
   */
  async toggleAutoFix(id, userId, enabled) {
    const repo = await this.getRepository(id, userId);
    const updated = await repositoryRepo.update(id, {
      autoFixEnabled: enabled
    });

    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'repository_autofix_toggled', updated);

    await db.activity.create({
      data: {
        eventType: 'repository_autofix_toggled',
        title: `Auto-Fix ${enabled ? 'Enabled' : 'Disabled'}`,
        description: `Auto-Fix was ${enabled ? 'enabled' : 'disabled'} for ${repo.fullName}.`,
        userId,
      },
    });

    return updated;
  },
};

export default repositoryService;
