import { Router } from 'express';
import * as agencyController from '../controllers/agencyController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

/* ── AGENCY-only endpoints ─────────────────────────────── */
const agencyOnly = requireRole('AGENCY');

router.post('/invite',          agencyOnly, agencyController.inviteCreator);
router.get ('/roster',          agencyOnly, agencyController.getRoster);

router.post('/notes',           agencyOnly, agencyController.addNote);
router.get ('/notes/:creatorId',agencyOnly, agencyController.getNotes);

router.post ('/tasks',          agencyOnly, agencyController.createTask);
router.get  ('/tasks',          agencyOnly, agencyController.getTasks);
router.patch('/tasks/:id',      agencyOnly, agencyController.updateTaskStatus);

/* ── INFLUENCER-only ──────────────────────────────────── */
router.post('/respond',         requireRole('INFLUENCER'), agencyController.respondToInvitation);

export default router;
