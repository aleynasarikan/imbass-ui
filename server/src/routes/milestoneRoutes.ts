import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as milestoneController from '../controllers/milestoneController';

const router = Router();

router.use(requireAuth);

// Direct milestone ops (by milestone id)
router.post('/:id/submit',   milestoneController.submitMilestone);
router.post('/:id/release',  milestoneController.releaseMilestone);

export default router;
