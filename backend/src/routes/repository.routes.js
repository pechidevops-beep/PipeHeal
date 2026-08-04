import { Router } from 'express';
import repositoryController from '../controllers/repository.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { addRepositorySchema, repositoryIdSchema } from '../validators/repository.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// List tracked repos in PipeHeal
router.get('/', asyncHandler(repositoryController.listRepositories));

// List the user's GitHub repositories (from GitHub API)
router.get('/github-repos', asyncHandler(repositoryController.listGithubRepositories));

// Add/track a new repository
router.post('/', validate(addRepositorySchema), asyncHandler(repositoryController.addRepository));

// Sync a repository's metadata from GitHub
router.post('/:id/sync', asyncHandler(repositoryController.syncRepository));

// Toggle auto-fix for a repository
router.patch('/:id/auto-fix', asyncHandler(repositoryController.toggleAutoFix));

// Remove/untrack a repository
router.delete('/:id', asyncHandler(repositoryController.removeRepository));

export default router;
