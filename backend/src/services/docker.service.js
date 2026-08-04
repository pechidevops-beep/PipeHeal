import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

const execAsync = promisify(exec);

export const dockerService = {
  async execute(command) {
    try {
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr, exitCode: 0 };
    } catch (err) {
      return { stdout: err.stdout || '', stderr: err.stderr || err.message, exitCode: err.code || 1 };
    }
  },

  async createContainer(image = env.DOCKER_SANDBOX_IMAGE || 'node:20-alpine') {
    const containerName = `sandbox-${randomUUID()}`;
    logger.info(`[Docker Service] Creating container ${containerName} from ${image}`);
    
    // We run the container in the background, keeping it alive
    // node:alpine needs 'sh -c "tail -f /dev/null"' to stay alive
    const cmd = `docker run -d --name ${containerName} ${image} sh -c "apk add git patch && tail -f /dev/null"`;
    const res = await this.execute(cmd);
    
    if (res.exitCode !== 0) {
      throw new ApiError(500, `Failed to create container: ${res.stderr}`, ERROR_CODES.SANDBOX_ERROR);
    }
    
    return containerName;
  },

  async copyRepository(containerId, repoFullName, commitSha) {
    logger.info(`[Docker Service] Cloning repository ${repoFullName} at commit ${commitSha} into ${containerId}`);
    
    // Clone repo directly inside the container
    const repoUrl = `https://github.com/${repoFullName}.git`;
    
    // Install git, clone, and checkout
    const cmd = `docker exec ${containerId} sh -c "git clone ${repoUrl} /app && cd /app && git checkout ${commitSha}"`;
    const res = await this.execute(cmd);
    
    if (res.exitCode !== 0) {
      throw new ApiError(500, `Failed to clone repository: ${res.stderr}`, ERROR_CODES.SANDBOX_ERROR);
    }
  },

  async applyPatch(containerId, patchDiff) {
    logger.info(`[Docker Service] Applying patch to ${containerId}`);
    
    // Create a temporary patch file locally
    const tmpDir = os.tmpdir();
    const patchPath = path.join(tmpDir, `patch-${randomUUID()}.diff`);
    
    await fs.writeFile(patchPath, patchDiff);
    
    // Copy patch to container
    let res = await this.execute(`docker cp ${patchPath} ${containerId}:/tmp/patch.diff`);
    if (res.exitCode !== 0) {
      await fs.unlink(patchPath).catch(() => {});
      throw new ApiError(500, `Failed to copy patch: ${res.stderr}`, ERROR_CODES.SANDBOX_ERROR);
    }
    
    // Clean up local patch file
    await fs.unlink(patchPath).catch(() => {});
    
    // Apply patch inside container using 'patch' command (which we installed)
    res = await this.execute(`docker exec ${containerId} sh -c "cd /app && patch -p1 < /tmp/patch.diff"`);
    if (res.exitCode !== 0) {
      throw new ApiError(500, `Failed to apply patch: ${res.stderr}`, ERROR_CODES.SANDBOX_ERROR);
    }
  },

  async runTests(containerId, command) {
    logger.info(`[Docker Service] Running tests inside ${containerId}: ${command}`);
    
    // If the command is npm install or tests, run it in /app
    // npm ci / install may be needed if dependencies aren't there
    const prepCmd = `docker exec ${containerId} sh -c "cd /app && npm install"`;
    await this.execute(prepCmd); // best effort
    
    const cmd = `docker exec ${containerId} sh -c "cd /app && ${command}"`;
    const res = await this.execute(cmd);
    
    return res;
  },

  async collectLogs(containerId) {
    logger.info(`[Docker Service] Collecting logs for ${containerId}`);
    // Gets the background docker logs if anything failed on startup
    const res = await this.execute(`docker logs ${containerId}`);
    return res.stdout + '\\n' + res.stderr;
  },

  async destroyContainer(containerId) {
    logger.info(`[Docker Service] Destroying container ${containerId}`);
    const res = await this.execute(`docker rm -f ${containerId}`);
    if (res.exitCode !== 0) {
      logger.error(`[Docker Service] Failed to destroy container ${containerId}: ${res.stderr}`);
    }
  }
};

export default dockerService;
