import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as revenueService from '../services/revenueService';
import * as creatorService from '../services/creatorService';

/** GET /api/creators/:slug/earnings?year=2026 — public */
export const creatorEarnings = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const creator = await creatorService.getCreatorBySlug(slug);
  if (!creator) return res.status(404).json({ message: 'Creator not found' });

  const yearParam = req.query.year;
  const year = typeof yearParam === 'string' ? parseInt(yearParam, 10) : undefined;
  if (yearParam !== undefined && (!Number.isFinite(year!) || year! < 2000 || year! > 2100)) {
    return res.status(400).json({ message: 'Invalid year' });
  }

  const data = await revenueService.creatorMonthlyEarnings(creator.userId, year);
  res.json(data);
});

/** GET /api/agencies/leaderboard — public */
export const agencyLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === 'string' ? Math.min(100, parseInt(limitParam, 10)) : 25;
  const data = await revenueService.agencyLeaderboard(Number.isFinite(limit) && limit > 0 ? limit : 25);
  res.json(data);
});
