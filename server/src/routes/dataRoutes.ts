import { Router } from 'express';
import * as dataController from '../controllers/dataController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// `/campaigns/*` handling migrated to campaignRoutes (Sprint 3).
// This router now only owns the non-colliding legacy endpoint for the
// agency dashboard's campaign tiles.
router.get('/influencers',          requireAuth, dataController.getInfluencers);
router.get('/dashboard/campaigns',  requireAuth, dataController.getCampaignsDashboard);

export default router;
