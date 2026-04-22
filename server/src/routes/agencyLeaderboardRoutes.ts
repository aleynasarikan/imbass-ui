import { Router } from 'express';
import * as revenueController from '../controllers/revenueController';

const router = Router();
router.get('/leaderboard', revenueController.agencyLeaderboard);
export default router;
