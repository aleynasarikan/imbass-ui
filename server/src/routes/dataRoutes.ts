import { Router } from 'express';
import * as dataController from '../controllers/dataController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/influencers', requireAuth, dataController.getInfluencers);
router.get('/campaigns', requireAuth, dataController.getCampaigns);

export default router;
