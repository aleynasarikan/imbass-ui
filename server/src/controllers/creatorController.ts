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
