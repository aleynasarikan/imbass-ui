import { Router } from 'express';
import * as campaignController from '../controllers/campaignController';
import * as milestoneController from '../controllers/milestoneController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/* Agency reviews a specific application (accept/reject) */
router.post('/:id/review', requireAuth, requireRole('AGENCY'), campaignController.reviewApplication);

/* Milestones scoped to an application */
router.get ('/:appId/milestones', requireAuth, milestoneController.listForApplication);
router.post('/:appId/milestones', requireAuth, requireRole('AGENCY'), milestoneController.createMilestone);

export default router;
