import { Router } from 'express';
import * as negotiationController from '../controllers/negotiationController';
import { requireAuth } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';

const router = Router();

router.get('/', requireAuth, negotiationController.getNegotiations);
router.post('/:campaignId/offer', requireAuth, auditMiddleware('MAKE_OFFER', 'NEGOTIATION'), negotiationController.makeOffer);
router.put('/:id/accept', requireAuth, auditMiddleware('ACCEPT_OFFER', 'NEGOTIATION'), negotiationController.acceptOffer);
router.put('/:id/reject', requireAuth, auditMiddleware('REJECT_OFFER', 'NEGOTIATION'), negotiationController.rejectOffer);

export default router;
