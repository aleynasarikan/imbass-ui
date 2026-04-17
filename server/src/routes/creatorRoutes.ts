import { Router } from 'express';
import * as creatorController from '../controllers/creatorController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/* ── Public ─────────────────────────────────────────────────── */
router.get('/',        creatorController.listCreators);
router.get('/:slug',   creatorController.getCreator);

/* ── Authed (follow graph) ──────────────────────────────────── */
router.post  ('/:id/follow', requireAuth, creatorController.followCreator);
router.delete('/:id/follow', requireAuth, creatorController.unfollowCreator);

export default router;
