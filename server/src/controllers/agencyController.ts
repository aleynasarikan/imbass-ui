import { Response } from 'express';
import * as agencyService from '../services/agencyService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

/* ─── helpers ─── */

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/* ─── AGENCY-only ─── */

export const inviteCreator = catchAsync(async (req: AuthRequest, res: Response) => {
  const { creatorId } = req.body ?? {};
  const { id: agencyId } = req.user;

  if (!isUuid(creatorId)) return res.status(400).json({ message: 'Valid creatorId (UUID) is required' });
  if (creatorId === agencyId) return res.status(400).json({ message: 'You cannot invite yourself' });

  const result = await agencyService.inviteCreator(agencyId, creatorId);
  if (!result.ok) {
    const msg = result.reason === 'not_found'
      ? 'Creator not found'
      : 'Only INFLUENCER users can be invited to an agency roster';
    return res.status(result.reason === 'not_found' ? 404 : 400).json({ message: msg });
  }
  res.status(201).json(result.row);
});

export const getRoster = catchAsync(async (req: AuthRequest, res: Response) => {
  const roster = await agencyService.getRoster(req.user.id);
  res.json(roster);
});

export const addNote = catchAsync(async (req: AuthRequest, res: Response) => {
  const { creatorId, body, isPinned } = req.body ?? {};
  const { id: agencyId } = req.user;

  if (!isUuid(creatorId)) return res.status(400).json({ message: 'Valid creatorId is required' });
  if (typeof body !== 'string' || body.trim().length === 0) {
    return res.status(400).json({ message: 'Note body is required' });
  }
  if (body.length > 4000) {
    return res.status(400).json({ message: 'Note body is too long (max 4000 chars)' });
  }

  const note = await agencyService.addNote(agencyId, creatorId, agencyId, body.trim(), !!isPinned);
  res.status(201).json(note);
});

export const getNotes = catchAsync(async (req: AuthRequest, res: Response) => {
  const { creatorId } = req.params;
  if (!isUuid(creatorId)) return res.status(400).json({ message: 'Valid creatorId is required' });
  const notes = await agencyService.getNotes(req.user.id, creatorId);
  res.json(notes);
});

export const createTask = catchAsync(async (req: AuthRequest, res: Response) => {
  const { title, creatorId, campaignId, assigneeId, description, dueAt } = req.body ?? {};
  const { id: agencyId } = req.user;

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'Task title is required' });
  }
  if (creatorId  && !isUuid(creatorId))  return res.status(400).json({ message: 'Invalid creatorId' });
  if (campaignId && !isUuid(campaignId)) return res.status(400).json({ message: 'Invalid campaignId' });
  if (assigneeId && !isUuid(assigneeId)) return res.status(400).json({ message: 'Invalid assigneeId' });

  const task = await agencyService.createTask({
    agencyId,
    title: title.trim(),
    creatorId, campaignId, assigneeId, description, dueAt,
  });
  res.status(201).json(task);
});

export const getTasks = catchAsync(async (req: AuthRequest, res: Response) => {
  const { creatorId, campaignId } = req.query;
  const tasks = await agencyService.getTasks(req.user.id, {
    creatorId:  typeof creatorId === 'string'  ? creatorId  : undefined,
    campaignId: typeof campaignId === 'string' ? campaignId : undefined,
  });
  res.json(tasks);
});

export const updateTaskStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const allowed = ['TODO','IN_PROGRESS','REVIEW','DONE','CANCELLED'];

  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid task id' });
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of ${allowed.join(', ')}` });
  }

  const task = await agencyService.updateTaskStatus(id, req.user.id, status);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

/* ─── INFLUENCER-only ─── */

export const respondToInvitation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { agencyId, accept } = req.body ?? {};
  const { id: creatorId } = req.user;

  if (!isUuid(agencyId)) return res.status(400).json({ message: 'Valid agencyId is required' });
  if (typeof accept !== 'boolean') return res.status(400).json({ message: 'accept must be a boolean' });

  const row = await agencyService.respondToInvitation(agencyId, creatorId, accept);
  if (!row) return res.status(404).json({ message: 'No pending invitation from this agency' });
  res.json(row);
});
