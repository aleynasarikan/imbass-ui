import { Router } from 'express';
import * as negotiationController from '../controllers/negotiationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, negotiationController.getNegotiations);
router.post('/:campaignId/offer', requireAuth, negotiationController.makeOffer);
router.put('/:id/accept', requireAuth, negotiationController.acceptOffer);
router.put('/:id/reject', requireAuth, negotiationController.rejectOffer);

export default router;
