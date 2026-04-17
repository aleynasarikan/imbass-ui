import { Response } from 'express';
import * as negotiationService from '../services/negotiationService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

export const getNegotiations = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user;
  const data = await negotiationService.getNegotiations(userId, role as string);
  res.json(data);
});

export const makeOffer = catchAsync(async (req: AuthRequest, res: Response) => {
  const { campaignId } = req.params;
  const { offerAmount } = req.body;
  const { id: userId, role } = req.user;

  if (offerAmount === undefined) {
    return res.status(400).json({ message: 'Offer amount is required' });
  }

  const negotiation = await negotiationService.makeOffer(
    campaignId as string,
    userId,
    role as string,
    offerAmount
  );
  res.status(201).json(negotiation);
});

export const acceptOffer = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // negotiation id
  const { id: userId } = req.user;
  const negotiation = await negotiationService.acceptOffer(id as string, userId);
  res.json(negotiation);
});

export const rejectOffer = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // negotiation id
  const { id: userId } = req.user;
  const negotiation = await negotiationService.rejectOffer(id as string, userId);
  res.json(negotiation);
});
