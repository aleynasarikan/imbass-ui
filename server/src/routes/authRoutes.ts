import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
