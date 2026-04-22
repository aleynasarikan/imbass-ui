import { Request, Response } from 'express';
import * as creatorService from '../services/creatorService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

/** GET /api/creators — public list with filters */
export const listCreators = catchAsync(async (req: Request, res: Response) => {
  const { q, niche, platform, available, limit, offset } = req.query;

  const data = await creatorService.listCreators({
    q:        typeof q === 'string'        ? q        : undefined,
    niche:    typeof niche === 'string'    ? niche    : undefined,
    platform: typeof platform === 'string' ? platform : undefined,
    available:
      available === 'true'  ? true  :
      available === 'false' ? false :
      undefined,
    limit:  limit  ? Math.min(100, parseInt(limit as string, 10))  : undefined,
    offset: offset ? Math.max(0, parseInt(offset as string, 10))   : undefined,
  });

  res.json(data);
});

/** GET /api/creators/:slug — public profile */
export const getCreator = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ message: 'Missing slug' });

  const data = await creatorService.getCreatorBySlug(slug);
  if (!data) return res.status(404).json({ message: 'Creator not found' });

  res.json(data);
});

/** POST /api/creators/:id/follow — auth, follows the creator identified by user id */
export const followCreator = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: targetUserId } = req.params;
  const { id: followerId } = req.user;

  if (!targetUserId) return res.status(400).json({ message: 'Missing user id' });
  if (targetUserId === followerId) return res.status(400).json({ message: 'Cannot follow yourself' });

  await creatorService.follow(followerId, targetUserId);
  res.status(204).send();
});

/** DELETE /api/creators/:id/follow — auth */
export const unfollowCreator = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: targetUserId } = req.params;
  const { id: followerId } = req.user;

  if (!targetUserId) return res.status(400).json({ message: 'Missing user id' });

  await creatorService.unfollow(followerId, targetUserId);
  res.status(204).send();
});

/** GET /api/me/follows — auth, list of followed creators */
export const listMyFollows = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: followerId } = req.user;
  const data = await creatorService.listFollowedCreators(followerId);
  res.json(data);
});

/* ─── Sprint 4: activity, leaderboard, availability ─── */

/** GET /api/creators/:slug/activity?year=2026 — public daily activity */
export const getCreatorActivity = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ message: 'Missing slug' });

  const creator = await creatorService.getCreatorBySlug(slug);
  if (!creator) return res.status(404).json({ message: 'Creator not found' });

  const yearParam = req.query.year;
  const year = typeof yearParam === 'string' ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ message: 'Invalid year' });
  }

  const data = await creatorService.getActivityForUser(creator.userId, year);
  res.json(data);
});

/** GET /api/creators/leaderboard — public ranked list of creators */
export const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === 'string' ? Math.min(100, parseInt(limitParam, 10)) : 25;
  const data = await creatorService.leaderboard(Number.isFinite(limit) && limit > 0 ? limit : 25);
  res.json(data);
});

/** PATCH /api/me/availability — INFLUENCER toggles is_available on their profile */
export const setMyAvailability = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'INFLUENCER') {
    return res.status(403).json({ message: 'Only creators have an availability flag' });
  }
  const { available } = req.body ?? {};
  if (typeof available !== 'boolean') {
    return res.status(400).json({ message: 'available must be a boolean' });
  }
  const ok = await creatorService.setAvailability(req.user.id, available);
  if (!ok && ok !== false) return res.status(404).json({ message: 'Profile not found' });
  res.json({ isAvailable: ok });
});

/** POST /api/creators/:slug/recompute — recompute XP/trust for a creator.
 *  Agencies can trigger this for any creator on their roster; the creator
 *  themselves can always recompute their own stats. */
export const recomputeCreator = catchAsync(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const creator = await creatorService.getCreatorBySlug(slug);
  if (!creator) return res.status(404).json({ message: 'Creator not found' });

  if (req.user.id !== creator.userId && req.user.role !== 'AGENCY') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await creatorService.recomputeLevel(creator.userId);
  const updated = await creatorService.getCreatorBySlug(slug);
  res.json(updated);
});
