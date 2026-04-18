import { Router } from 'express';
import * as agencyController from '../controllers/agencyController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/invite', agencyController.inviteCreator);
router.post('/respond', agencyController.respondToInvitation);
router.get('/roster', agencyController.getRoster);

router.post('/notes', agencyController.addNote);
router.get('/notes/:creatorId', agencyController.getNotes);

router.post('/tasks', agencyController.createTask);
router.get('/tasks', agencyController.getTasks);
router.patch('/tasks/:id', agencyController.updateTaskStatus);

export default router;
