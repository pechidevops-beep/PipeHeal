import axios from 'axios';
import AdmZip from 'adm-zip';
import { env } from '../config/env.js';
import { verifyWebhookSignature } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

/**
 * GitHub Service
 * Interacts with the GitHub API.
 */
export const githubService = {
  /**
   * Helper to create an axios instance for GitHub API requests.
   */
  getClient(token) {
    if (!token) {
      throw new ApiError(401, 'GitHub token is missing', ERROR_CODES.UNAUTHORIZED);
    }
    return axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  },

  /**
   * Verifies the GitHub webhook signature.
   */
  verifyWebhook(payload, signature) {
    return verifyWebhookSignature(payload, signature, env.GITHUB_WEBHOOK_SECRET);
  },

  // ─────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────

  /**
   * Exchanges an OAuth code for a GitHub access token.
   */
  async authenticate(code) {
    try {
      const res = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: 'application/json' } }
      );
      if (res.data.error) {
        throw new ApiError(400, res.data.error_description || 'OAuth failed', ERROR_CODES.OAUTH_FAILED);
      }
      return res.data.access_token;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error(`[GitHub] authenticate failed: ${err.message}`);
      throw new ApiError(500, 'GitHub token exchange failed', ERROR_CODES.OAUTH_FAILED);
    }
  },

  // ─────────────────────────────────────────────
  // REPOSITORIES
  // ─────────────────────────────────────────────

  /**
   * Lists all repositories for the authenticated user.
   */
  async listRepositories(token, page = 1, perPage = 100, sort = 'updated', direction = 'desc') {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/user/repos`, {
        params: {
          sort,
          direction,
          per_page: perPage,
          page,
          affiliation: 'owner,collaborator,organization_member',
        },
      });
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] listRepositories failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Gets a specific repository details.
   */
  async getRepository(owner, repo, token) {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/repos/${owner}/${repo}`);
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] getRepository failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Syncs latest repository metadata from GitHub.
   */
  async syncRepository(owner, repo, token) {
    return this.getRepository(owner, repo, token);
  },

  // ─────────────────────────────────────────────
  // WEBHOOKS
  // ─────────────────────────────────────────────

  /**
   * Creates a webhook on a GitHub repository.
   */
  async createWebhook(owner, repo, webhookUrl, secret, token) {
    try {
      const client = this.getClient(token);
      const res = await client.post(`/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push', 'workflow_run', 'workflow_job', 'check_suite', 'check_run', 'deployment_status', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
          secret,
        },
      });
      return res.data;
    } catch (err) {
      // 422 means webhook already exists — treat as success
      if (err.response?.status === 422) {
        logger.warn(`[GitHub API] Webhook already exists for ${owner}/${repo}`);
        // Try to list existing webhooks to return the id
        const existing = await this.listWebhooks(owner, repo, token);
        const found = existing.find(h => h.config?.url === webhookUrl);
        return found || { id: null };
      }
      logger.error(`[GitHub API] createWebhook failed: ${err.message}`);
      throw new ApiError(500, 'Failed to create GitHub webhook', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Lists webhooks for a repository.
   */
  async listWebhooks(owner, repo, token) {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/repos/${owner}/${repo}/hooks`);
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] listWebhooks failed: ${err.message}`);
      return [];
    }
  },

  /**
   * Deletes a webhook from a GitHub repository.
   */
  async deleteWebhook(owner, repo, webhookId, token) {
    try {
      const client = this.getClient(token);
      await client.delete(`/repos/${owner}/${repo}/hooks/${webhookId}`);
      return true;
    } catch (err) {
      if (err.response?.status === 404) {
        logger.warn(`[GitHub API] Webhook ${webhookId} not found on GitHub (already deleted)`);
        return true;
      }
      logger.error(`[GitHub API] deleteWebhook failed: ${err.message}`);
      throw new ApiError(500, 'Failed to delete GitHub webhook', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  // ─────────────────────────────────────────────
  // WORKFLOW RUNS
  // ─────────────────────────────────────────────

  /**
   * Gets a specific workflow run.
   */
  async getWorkflowRun(owner, repo, runId, token) {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/repos/${owner}/${repo}/actions/runs/${runId}`);
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] getWorkflowRun failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Gets the jobs for a workflow run.
   */
  async getJobs(owner, repo, runId, token) {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] getJobs failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Downloads and extracts the raw workflow logs as text.
   */
  async downloadWorkflowLogs(owner, repo, runId, token, retries = 3) {
    const client = this.getClient(token);
    for (let i = 0; i < retries; i++) {
      try {
        const res = await client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/logs`, {
          responseType: 'arraybuffer',
        });
        
        const zip = new AdmZip(Buffer.from(res.data));
        const zipEntries = zip.getEntries();
        
        let allLogs = '';
        for (const entry of zipEntries) {
          if (!entry.isDirectory) {
            allLogs += `\n--- Log: ${entry.entryName} ---\n`;
            allLogs += zip.readAsText(entry);
          }
        }
        
        return allLogs;
      } catch (err) {
        if (err.response?.status === 404 && i < retries - 1) {
          logger.warn(`[GitHub API] Logs not ready for ${runId}, retrying in 3s...`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        logger.error(`[GitHub API] downloadWorkflowLogs failed: ${err.message}`);
        throw new ApiError(500, 'Failed to download logs', ERROR_CODES.GITHUB_API_ERROR);
      }
    }
  },

  // ─────────────────────────────────────────────
  // FILES & PULL REQUESTS
  // ─────────────────────────────────────────────

  /**
   * Retrieves file content from a repository.
   */
  async getFile(owner, repo, path, token, ref = 'main') {
    try {
      const client = this.getClient(token);
      const res = await client.get(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
      
      // Decode base64 if necessary
      if (res.data.content && res.data.encoding === 'base64') {
        const decoded = Buffer.from(res.data.content, 'base64').toString('utf8');
        return { content: decoded, sha: res.data.sha };
      }
      return { content: res.data, sha: res.data.sha };
    } catch (err) {
      logger.error(`[GitHub API] getFile failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Creates a new branch off an existing base branch.
   */
  async createBranch(owner, repo, newBranchName, baseBranch, token) {
    try {
      const client = this.getClient(token);
      // 1. Get SHA of base branch
      const refRes = await client.get(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
      const sha = refRes.data.object.sha;
      
      // 2. Create new branch
      const res = await client.post(`/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${newBranchName}`,
        sha
      });
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] createBranch failed: ${err.message}`);
      throw new ApiError(500, 'Failed to create branch', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Commits a file update directly to a branch.
   */
  async commitFile(owner, repo, path, message, content, branch, token, sha = null) {
    try {
      const client = this.getClient(token);
      const body = {
        message,
        content: Buffer.from(content).toString('base64'),
        branch
      };
      if (sha) body.sha = sha;

      const res = await client.put(`/repos/${owner}/${repo}/contents/${path}`, body);
      return res.data;
    } catch (err) {
      if (err.response) {
        logger.error(`[GitHub API] commitFile failed with ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
        logger.error(`[GitHub API] commitFile failed: ${err.message}`);
      }
      throw new ApiError(500, 'Failed to commit file', ERROR_CODES.GITHUB_API_ERROR);
    }
  },

  /**
   * Creates a draft pull request with a generated patch.
   */
  async createDraftPR(owner, repo, title, body, head, base, token) {
    try {
      const client = this.getClient(token);
      const res = await client.post(`/repos/${owner}/${repo}/pulls`, {
        title,
        body,
        head,
        base,
        draft: true,
      });
      return res.data;
    } catch (err) {
      logger.error(`[GitHub API] createDraftPR failed: ${err.message}`);
      throw new ApiError(500, 'GitHub API Error', ERROR_CODES.GITHUB_API_ERROR);
    }
  },
};

export default githubService;
