import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { profileUpdateSchema } from '../schemas';

const router = Router();

router.get('/me', requireAuth, profileController.getMe);
router.put('/me', requireAuth, validate(profileUpdateSchema), profileController.updateMe);

export default router;
