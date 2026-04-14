import { Request, Response } from 'express';
import * as negotiationService from '../services/negotiationService';
import { catchAsync } from '../utils/catchAsync';

export const getNegotiations = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  const role = req.user.role;
  const data = await negotiationService.getNegotiations(userId, role);
  res.json(data);
});

export const makeOffer = catchAsync(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { offerAmount } = req.body;
  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  const role = req.user.role;

  if (offerAmount === undefined) {
    return res.status(400).json({ message: 'Offer amount is required' });
  }

  const negotiation = await negotiationService.makeOffer(campaignId, userId, role, offerAmount);
  res.status(201).json(negotiation);
});

export const acceptOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // negotiation id
  // @ts-ignore
  const userId = req.user.id;
  const negotiation = await negotiationService.acceptOffer(id, userId);
  res.json(negotiation);
});

export const rejectOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // negotiation id
  // @ts-ignore
  const userId = req.user.id;
  const negotiation = await negotiationService.rejectOffer(id, userId);
  res.json(negotiation);
});
