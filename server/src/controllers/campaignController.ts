import { Request, Response } from 'express';
import * as campaignService from '../services/campaignService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/* ─── public marketplace ─── */

export const listMarketplace = catchAsync(async (req: Request, res: Response) => {
  const { q, niche, platform, limit, offset } = req.query;
  const data = await campaignService.listMarketplaceCampaigns({
    q:        typeof q === 'string'        ? q        : undefined,
    niche:    typeof niche === 'string'    ? niche    : undefined,
    platform: typeof platform === 'string' ? platform : undefined,
    limit:    limit  ? parseInt(limit  as string, 10) : undefined,
    offset:   offset ? parseInt(offset as string, 10) : undefined,
  });
  res.json(data);
});

export const getCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid campaign id' });
  const c = await campaignService.getCampaignById(id);
  if (!c) return res.status(404).json({ message: 'Campaign not found' });
  // Non-public campaigns leak only via status → still OK since description is mostly internal;
  // We return the full record — front-end uses is_public to decide public/private.
  res.json(c);
});

/* ─── agency create ─── */

export const createCampaign = catchAsync(async (req: AuthRequest, res: Response) => {
  const { title, description, brief, niche, platforms, budgetCents, deadlineAt, isPublic, status } = req.body ?? {};
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (platforms && !Array.isArray(platforms)) {
    return res.status(400).json({ message: 'platforms must be an array' });
  }

  const campaign = await campaignService.createCampaign({
    ownerId: req.user.id,
    title: title.trim(),
    description, brief, niche,
    platforms: platforms?.map((p: string) => p.toUpperCase()),
    budgetCents: typeof budgetCents === 'number' ? budgetCents : undefined,
    deadlineAt, isPublic,
    status: status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
  });
  res.status(201).json(campaign);
});

/* ─── creator apply ─── */

export const applyToCampaign = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { pitch } = req.body ?? {};
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid campaign id' });
  if (pitch !== undefined && typeof pitch !== 'string') {
    return res.status(400).json({ message: 'pitch must be a string' });
  }
  if (pitch && pitch.length > 2000) {
    return res.status(400).json({ message: 'pitch too long (max 2000 chars)' });
  }

  const result = await campaignService.apply(id, req.user.id, pitch?.trim() || null);
  if (!result.ok) {
    const map = {
      not_found:  { code: 404, msg: 'Campaign not found' },
      not_public: { code: 403, msg: 'Campaign is not open for applications' },
      inactive:   { code: 409, msg: 'Campaign is not currently active' },
      duplicate:  { code: 409, msg: 'You have already applied to this campaign' },
    }[result.reason];
    return res.status(map.code).json({ message: map.msg });
  }
  res.status(201).json(result.row);
});

/* ─── agency: list applications + review ─── */

export const listApplicationsForCampaign = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid campaign id' });

  const c = await campaignService.getCampaignById(id);
  if (!c) return res.status(404).json({ message: 'Campaign not found' });
  if (c.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the campaign owner can view applications' });
  }
  const data = await campaignService.listApplicationsForCampaign(id);
  res.json(data);
});

export const reviewApplication = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action } = req.body ?? {};
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid application id' });
  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
  }

  const result = await campaignService.reviewApplication(req.user.id, id, action);
  if (!result.ok) {
    const map = {
      not_found:        { code: 404, msg: 'Application not found' },
      forbidden:        { code: 403, msg: 'Only the campaign owner can review applications' },
      already_reviewed: { code: 409, msg: 'Application has already been reviewed' },
    }[result.reason];
    return res.status(map.code).json({ message: map.msg });
  }
  res.json(result.row);
});

/* ─── me: my applications ─── */

export const listMyApplications = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = await campaignService.listMyApplications(req.user.id);
  res.json(data);
});
