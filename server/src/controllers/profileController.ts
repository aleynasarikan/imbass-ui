import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as profileService from '../services/profileService';
import { catchAsync } from '../utils/catchAsync';

export const getMe = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const profile = await profileService.getMyProfile(req.user.id);
  res.json(profile);
});

export const updateMe = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await profileService.updateMyProfile(req.user.id, req.body);
  res.json({ message: 'Profile updated successfully' });
});
