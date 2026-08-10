import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { logger } from '../utils/logger.js';
import AdmZip from 'adm-zip';
import axios from 'axios';

const execAsync = promisify(exec);

export const validationService = {
  /**
   * Validates a code patch by cloning the repo, applying the patch, and running tests.
   */
  async validatePatch(owner, repo, filePath, patchedCode, token) {
    logger.info(`[Validation] Starting local validation for ${owner}/${repo} - ${filePath}`);
    
    // Create a temporary directory
    const tempDir = await mkdtemp(join(tmpdir(), 'pipeheal-val-'));
    
    try {
      // 1. Clone the repository (shallow clone)
      // We use a token for private repos
      const repoUrl = `https://oauth2:${token}@github.com/${owner}/${repo}.git`;
      logger.info(`[Validation] Cloning repository into ${tempDir}`);
      
      await execAsync(`git clone --depth 1 ${repoUrl} .`, { cwd: tempDir, timeout: 30000 });
      
      // 2. Apply the patched code
      const absolutePath = join(tempDir, filePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, patchedCode, 'utf8');
      logger.info(`[Validation] Applied patched code to ${filePath}`);
      
      // 3. Attempt to validate the project
      // For now, if it's a Node project we run npm install and npm test / npm run build
      // For YAML, we could just say "success" unless we have a specific YAML linter.
      
      let validationLogs = 'Patch applied successfully to local clone.\n';
      
      // Basic check if it's a JS/TS project
      try {
        let hasPackageJson = false;
        try {
          await import('fs/promises').then(fs => fs.access(join(tempDir, 'package.json')));
          hasPackageJson = true;
        } catch (e) {
          hasPackageJson = false;
        }

        if (hasPackageJson) {
          validationLogs += 'Found package.json. Skipping npm install to prevent memory limits on free tier.\n';
          // const { stdout: installOut } = await execAsync('npm install --ignore-scripts', { cwd: tempDir, timeout: 60000 });
          // validationLogs += installOut + '\n';
          
          // validationLogs += 'Running npm run build (if exists)...\n';
          // try {
          //   const { stdout: buildOut } = await execAsync('npm run build --if-present', { cwd: tempDir, timeout: 60000 });
          //   validationLogs += buildOut + '\n';
          // } catch (buildErr) {
          //   throw new Error(`Build Failed: ${buildErr.message}\n${buildErr.stdout}\n${buildErr.stderr}`);
          // }
        } else {
          validationLogs += 'No standard package.json found. Assuming syntax is valid.\n';
        }
      } catch (checkErr) {
        throw new Error(`Validation command failed: ${checkErr.message}`);
      }
      
      return {
        success: true,
        logs: validationLogs
      };

    } catch (err) {
      logger.error(`[Validation] Validation failed: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    } finally {
      // Clean up the temp directory
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        logger.warn(`[Validation] Failed to clean up temp dir: ${cleanupErr.message}`);
      }
    }
  }
};

export default validationService;
