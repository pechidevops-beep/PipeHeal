import { Router } from 'express';

import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import repositoryRoutes from './repository.routes.js';
import pipelineRoutes from './pipeline.routes.js';
import workflowRunRoutes from './workflowRun.routes.js';
import incidentRoutes from './incident.routes.js';
import diagnosisRoutes from './diagnosis.routes.js';
import sandboxRoutes from './sandbox.routes.js';
import pullRequestRoutes from './pullRequest.routes.js';
import webhookRoutes from './webhook.routes.js';
import healthRoutes from './health.routes.js';
import activityRoutes from './activity.routes.js';
import knowledgeBaseRoutes from './knowledgeBase.routes.js';

const router = Router();

// API versioning wrapper (e.g. /api/v1)
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/repositories', repositoryRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/workflow-runs', workflowRunRoutes);
router.use('/incidents', incidentRoutes);
router.use('/diagnosis', diagnosisRoutes);
router.use('/sandbox', sandboxRoutes);
router.use('/pull-requests', pullRequestRoutes);
router.use('/github', webhookRoutes);
router.use('/health', healthRoutes);
router.use('/activity', activityRoutes);
router.use('/knowledge-base', knowledgeBaseRoutes);

export default router;
