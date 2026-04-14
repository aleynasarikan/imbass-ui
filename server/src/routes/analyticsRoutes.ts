import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/weekly', requireAuth, analyticsController.getWeekly);
router.get('/timeseries', requireAuth, analyticsController.getTimeseries);
router.get('/summary', requireAuth, analyticsController.getSummary);

export default router;
