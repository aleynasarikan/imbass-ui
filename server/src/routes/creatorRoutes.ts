import { Router } from 'express';
import * as creatorController from '../controllers/creatorController';
import * as revenueController from '../controllers/revenueController';
import * as badgeController from '../controllers/badgeController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/* ── Public ─────────────────────────────────────────────────── */
router.get('/leaderboard',    creatorController.getLeaderboard);   // must come before /:slug
router.get('/',               creatorController.listCreators);
router.get('/:slug/activity', creatorController.getCreatorActivity);
router.get('/:slug/earnings', revenueController.creatorEarnings);
router.get('/:slug/badges',   badgeController.listBadges);
router.get('/:slug',          creatorController.getCreator);

/* ── Authed (follow graph) ──────────────────────────────────── */
router.post  ('/:id/follow',       requireAuth, creatorController.followCreator);
router.delete('/:id/follow',       requireAuth, creatorController.unfollowCreator);
router.post  ('/:slug/recompute',  requireAuth, creatorController.recomputeCreator);

export default router;
