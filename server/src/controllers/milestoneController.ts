import { Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';
import * as milestoneService from '../services/milestoneService';
import { query } from '../db';

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** GET /api/applications/:appId/milestones — both sides of the app can read */
export const listForApplication = catchAsync(async (req: AuthRequest, res: Response) => {
  const { appId } = req.params;
  if (!isUuid(appId)) return res.status(400).json({ message: 'Invalid application id' });

  // Permission: caller must be the influencer on the app OR the campaign owner
  const ctx = await query(`
    SELECT a.influencer_id, c.creator_id AS owner_id
      FROM applications a JOIN campaigns c ON c.id = a.campaign_id
     WHERE a.id = $1
  `, [appId]);
  if (ctx.rowCount === 0) return res.status(404).json({ message: 'Application not found' });
  const { influencer_id, owner_id } = ctx.rows[0];
  if (req.user.id !== influencer_id && req.user.id !== owner_id) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const data = await milestoneService.listForApplication(appId);
  res.json(data);
});

/** POST /api/applications/:appId/milestones — agency (campaign owner) only */
export const createMilestone = catchAsync(async (req: AuthRequest, res: Response) => {
  const { appId } = req.params;
  const { title, description, amountCents, dueAt, position } = req.body ?? {};
  if (!isUuid(appId)) return res.status(400).json({ message: 'Invalid application id' });
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'title is required' });
  }
  if (typeof amountCents !== 'number' || amountCents < 0) {
    return res.status(400).json({ message: 'amountCents must be a non-negative number' });
  }

  const ctx = await query(`
    SELECT a.id, a.status, a.campaign_id, c.creator_id AS owner_id
      FROM applications a JOIN campaigns c ON c.id = a.campaign_id
     WHERE a.id = $1
  `, [appId]);
  if (ctx.rowCount === 0) return res.status(404).json({ message: 'Application not found' });
  const row = ctx.rows[0];
  if (row.owner_id !== req.user.id) {
    return res.status(403).json({ message: 'Only the campaign owner can create milestones' });
  }
  if (row.status !== 'ACCEPTED') {
    return res.status(409).json({ message: 'Milestones can only be added to accepted applications' });
  }

  const m = await milestoneService.create({
    campaignId: row.campaign_id,
    applicationId: appId,
    title: title.trim(),
    description,
    amountCents,
    dueAt,
    position,
  });
  res.status(201).json(m);
});

/** POST /api/milestones/:id/submit — creator flips to SUBMITTED */
export const submitMilestone = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid milestone id' });

  const ctx = await milestoneService.getContext(id);
  if (!ctx) return res.status(404).json({ message: 'Milestone not found' });
  if (ctx.creatorId !== req.user.id) {
    return res.status(403).json({ message: 'Only the assigned creator can submit this milestone' });
  }
  if (ctx.status === 'RELEASED' || ctx.status === 'APPROVED' || ctx.status === 'SUBMITTED') {
    return res.status(409).json({ message: 'Milestone has already been submitted or approved' });
  }

  const updated = await milestoneService.submit(id);
  void milestoneService.emitSubmitted(updated, ctx.ownerId);
  res.json(updated);
});

/** POST /api/milestones/:id/release — agency approves + releases escrow */
export const releaseMilestone = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid milestone id' });

  const ctx = await milestoneService.getContext(id);
  if (!ctx) return res.status(404).json({ message: 'Milestone not found' });
  if (ctx.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the campaign owner can release milestones' });
  }
  if (ctx.status === 'RELEASED') {
    return res.status(409).json({ message: 'Milestone has already been released' });
  }

  const updated = await milestoneService.approveAndRelease(id);
  if (ctx.creatorId) void milestoneService.emitReleased(updated, ctx.creatorId);
  res.json(updated);
});
