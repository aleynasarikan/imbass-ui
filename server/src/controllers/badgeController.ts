import { Request, Response } from 'express';
import * as badgeService from '../services/badgeService';
import * as creatorService from '../services/creatorService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

/** GET /api/creators/:slug/badges — public badge list */
export const listBadges = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const creator = await creatorService.getCreatorBySlug(slug);
  if (!creator) return res.status(404).json({ message: 'Creator not found' });

  const badges = await badgeService.listForUser(creator.userId);
  res.json(badges);
});
