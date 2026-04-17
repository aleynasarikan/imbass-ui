import { Request, Response } from 'express';
import * as dataService from '../services/dataService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

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

export const createCampaign = catchAsync(async (req: AuthRequest, res: Response) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const { id: userId, role: userRole } = req.user;

  if (userRole === 'INFLUENCER') {
    return res.status(403).json({ message: 'Only Agencies, Brands, and Producers can create campaigns' });
  }

  const campaign = await dataService.createCampaign(userId, title);
  res.status(201).json(campaign);
});

export const applyCampaign = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // campaign id
  const { id: userId, role: userRole } = req.user;

  if (userRole !== 'INFLUENCER') {
    return res.status(403).json({ message: 'Only Influencers can apply to campaigns' });
  }

  const application = await dataService.applyCampaign(id as string, userId);
  res.status(201).json(application);
});
