import { Router } from 'express';
import diagnosisController from '../controllers/diagnosis.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { diagnoseSchema, generateFixSchema } from '../validators/diagnosis.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/', validate(diagnoseSchema), asyncHandler(diagnosisController.diagnose));
router.post('/patch', validate(generateFixSchema), asyncHandler(diagnosisController.generateFix));

export default router;
