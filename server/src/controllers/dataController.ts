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

export const getCampaignsDashboard = catchAsync(async (req: Request, res: Response) => {
  const data = await dataService.getCampaignsDashboard();
  res.json(data);
});

export const createCampaign = catchAsync(async (req: Request, res: Response) => {
  const { title } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  const userRole = req.user.role;

  if (userRole === 'INFLUENCER') {
    return res.status(403).json({ message: 'Only Agencies and Producers can create campaigns' });
  }

  const campaign = await dataService.createCampaign(userId, title);
  res.status(201).json(campaign);
});

export const applyCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // campaign id
  
  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  const userRole = req.user.role;

  if (userRole !== 'INFLUENCER') {
    return res.status(403).json({ message: 'Only Influencers can apply to campaigns' });
  }

  const application = await dataService.applyCampaign(id, userId);
  res.status(201).json(application);
});
