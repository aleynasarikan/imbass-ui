import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/weekly', requireAuth, analyticsController.getWeekly);

export default router;
