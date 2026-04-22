import { Router } from 'express';
import * as campaignController from '../controllers/campaignController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/* ── Public ─────────────────────────────────────────────── */
router.get('/marketplace',  campaignController.listMarketplace);
router.get('/:id',          campaignController.getCampaign);

/* ── Agency create + manage applications ────────────────── */
router.post('/',                  requireAuth, requireRole('AGENCY'), campaignController.createCampaign);
router.get ('/:id/applications',  requireAuth, requireRole('AGENCY'), campaignController.listApplicationsForCampaign);

/* ── Creator: apply ─────────────────────────────────────── */
router.post('/:id/apply',         requireAuth, requireRole('INFLUENCER'), campaignController.applyToCampaign);

export default router;
