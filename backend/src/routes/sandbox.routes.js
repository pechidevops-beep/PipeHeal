import { Router } from 'express';
import sandboxController from '../controllers/sandbox.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { runSandboxSchema, sandboxIdSchema } from '../validators/sandbox.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { db } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.use(authenticate);

// List all sandbox runs (paginated)
router.get('/', asyncHandler(async (req, res) => {
  if (!db) return ApiResponse.ok(res, { data: [], total: 0 }, 'No DB');
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    db.sandboxRun.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        incident: {
          select: {
            title: true,
            repositoryId: true,
            patches: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    }),
    db.sandboxRun.count(),
  ]);
  return ApiResponse.paginated(res, data, { total, page, limit, pages: Math.ceil(total / limit) });
}));

// Run a new sandbox verification
router.post('/', aiLimiter, validate(runSandboxSchema), asyncHandler(sandboxController.runSandbox));
router.post('/run', aiLimiter, asyncHandler(sandboxController.runSandbox)); // alias

// Get a specific sandbox run
router.get('/:id', validate(sandboxIdSchema, 'params'), asyncHandler(sandboxController.getSandboxRun));

export default router;
