import { Response } from 'express';
import * as agencyService from '../services/agencyService';
import { catchAsync } from '../utils/catchAsync';

export const inviteCreator = catchAsync(async (req: any, res: Response) => {
  const { creatorId } = req.body;
  const agencyId = req.user.id;
  
  if (req.user.role !== 'AGENCY') {
    return res.status(403).json({ message: 'Only agencies can invite creators' });
  }

  const result = await agencyService.inviteCreator(agencyId, creatorId);
  res.status(201).json(result);
});

export const getRoster = catchAsync(async (req: any, res: Response) => {
  const agencyId = req.user.id;
  
  if (req.user.role !== 'AGENCY') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const roster = await agencyService.getRoster(agencyId);
  res.json(roster);
});

export const respondToInvitation = catchAsync(async (req: any, res: Response) => {
  const { agencyId, accept } = req.body;
  const creatorId = req.user.id;

  if (req.user.role !== 'INFLUENCER') {
    return res.status(403).json({ message: 'Only creators can respond to invitations' });
  }

  const result = await agencyService.respondToInvitation(agencyId, creatorId, accept);
  res.json(result);
});

export const addNote = catchAsync(async (req: any, res: Response) => {
  const { creatorId, body, isPinned } = req.body;
  const agencyId = req.user.id;
  const authorId = req.user.id;

  const note = await agencyService.addNote(agencyId, creatorId, authorId, body, isPinned);
  res.status(201).json(note);
});

export const getNotes = catchAsync(async (req: any, res: Response) => {
  const { creatorId } = req.params;
  const agencyId = req.user.id;

  const notes = await agencyService.getNotes(agencyId, creatorId);
  res.json(notes);
});

export const createTask = catchAsync(async (req: any, res: Response) => {
  const agencyId = req.user.id;
  const task = await agencyService.createTask({ ...req.body, agencyId });
  res.status(201).json(task);
});

export const getTasks = catchAsync(async (req: any, res: Response) => {
  const agencyId = req.user.id;
  const { creatorId, campaignId } = req.query;
  const tasks = await agencyService.getTasks(agencyId, { 
    creatorId: creatorId as string, 
    campaignId: campaignId as string 
  });
  res.json(tasks);
});

export const updateTaskStatus = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const agencyId = req.user.id;
  
  const task = await agencyService.updateTaskStatus(id, agencyId, status);
  res.json(task);
});
