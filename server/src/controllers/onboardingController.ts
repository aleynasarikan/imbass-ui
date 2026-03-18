import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as onboardingService from '../services/onboardingService';
import { catchAsync } from '../utils/catchAsync';

export const getStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const status = await onboardingService.getOnboardingStatus(req.user.id);
  res.json(status);
});

export const completeInfluencer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await onboardingService.completeInfluencerOnboarding(req.user.id, req.body);
  res.json({ message: 'Influencer onboarding completed' });
});

export const completeAgency = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await onboardingService.completeAgencyOnboarding(req.user.id, req.body);
  res.json({ message: 'Agency onboarding completed' });
});
