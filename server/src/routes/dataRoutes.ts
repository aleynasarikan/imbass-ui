import { Router } from 'express';
import * as dataController from '../controllers/dataController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/influencers', requireAuth, dataController.getInfluencers);
router.get('/campaigns', requireAuth, dataController.getCampaigns);
router.get('/campaigns/dashboard', requireAuth, dataController.getCampaignsDashboard);
router.post('/campaigns', requireAuth, dataController.createCampaign);
router.post('/campaigns/:id/apply', requireAuth, dataController.applyCampaign);

export default router;
