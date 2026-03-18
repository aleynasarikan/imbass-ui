import { Router } from 'express';
import * as onboardingController from '../controllers/onboardingController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { influencerOnboardingSchema, agencyOnboardingSchema } from '../schemas';

const router = Router();

router.get('/status', requireAuth, onboardingController.getStatus);
router.post('/influencer', requireAuth, validate(influencerOnboardingSchema), onboardingController.completeInfluencer);
router.post('/agency', requireAuth, validate(agencyOnboardingSchema), onboardingController.completeAgency);

export default router;
