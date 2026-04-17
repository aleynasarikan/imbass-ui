import { Router } from 'express';
import * as creatorController from '../controllers/creatorController';
import { requireAuth } from '../middleware/auth';

/**
 * Current-user ("me") endpoints. All require auth.
 * Kept separate from resource routers so `/api/me/...` never collides
 * with path params like `/api/creators/:slug`.
 */
const router = Router();

router.get('/follows', requireAuth, creatorController.listMyFollows);

export default router;
