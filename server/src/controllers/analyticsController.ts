import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';
import { catchAsync } from '../utils/catchAsync';

export const getWeekly = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.getWeeklyAnalytics();
  res.json(data);
});
