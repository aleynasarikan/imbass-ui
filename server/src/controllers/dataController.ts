import { Request, Response } from 'express';
import * as dataService from '../services/dataService';
import { catchAsync } from '../utils/catchAsync';

export const getInfluencers = catchAsync(async (req: Request, res: Response) => {
  const data = await dataService.getInfluencers();
  res.json(data);
});

export const getCampaigns = catchAsync(async (req: Request, res: Response) => {
  const data = await dataService.getCampaigns();
  res.json(data);
});
