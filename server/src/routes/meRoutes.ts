import { Router } from 'express';
import * as creatorController from '../controllers/creatorController';
import * as campaignController from '../controllers/campaignController';
import * as notificationController from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

/**
 * Current-user ("me") endpoints. All require auth.
 * Kept separate from resource routers so `/api/me/...` never collides
 * with path params like `/api/creators/:slug`.
 */
const router = Router();
router.use(requireAuth);

router.get('/follows',       creatorController.listMyFollows);
router.get('/applications',  campaignController.listMyApplications);
router.patch('/availability', creatorController.setMyAvailability);

router.get   ('/notifications',             notificationController.list);
router.get   ('/notifications/unread-count',notificationController.unreadCount);
router.post  ('/notifications/:id/read',    notificationController.markRead);
router.post  ('/notifications/read-all',    notificationController.markAllRead);

export default router;
