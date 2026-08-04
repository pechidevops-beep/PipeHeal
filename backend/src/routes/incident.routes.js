import { Router } from 'express';
import incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createIncidentSchema, updateIncidentSchema, incidentIdSchema } from '../validators/incident.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(incidentController.listIncidents));
router.post('/', validate(createIncidentSchema), asyncHandler(incidentController.createIncident));

router.get('/:id', validate(incidentIdSchema, 'params'), asyncHandler(incidentController.getIncident));
router.patch('/:id', validate(incidentIdSchema, 'params'), validate(updateIncidentSchema), asyncHandler(incidentController.updateIncident));
router.post('/:id/patch', validate(incidentIdSchema, 'params'), asyncHandler(incidentController.generatePatch));

export default router;
