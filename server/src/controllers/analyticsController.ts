import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';
import { catchAsync } from '../utils/catchAsync';

export const getWeekly = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.getWeeklyAnalytics();
  res.json(data);
});

export const getTimeseries = catchAsync(async (req: Request, res: Response) => {
  const { filter } = req.query; // '24h', '7d', 'All'
  const data = await analyticsService.getTimeseriesAnalytics(filter as string);
  res.json(data);
});

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.getSummaryAnalytics();
  res.json(data);
});
