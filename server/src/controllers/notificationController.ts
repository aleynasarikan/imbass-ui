import { Response } from 'express';
import * as notif from '../services/notificationService';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../types';

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { limit, offset, unread } = req.query;
  const data = await notif.list(req.user.id, {
    limit:  limit  ? parseInt(limit  as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    unreadOnly: unread === 'true',
  });
  res.json(data);
});

export const unreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const n = await notif.unreadCount(req.user.id);
  res.json({ count: n });
});

export const markRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ message: 'Invalid notification id' });
  const ok = await notif.markRead(req.user.id, id);
  if (!ok) return res.status(404).json({ message: 'Notification not found' });
  res.status(204).send();
});

export const markAllRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const n = await notif.markAllRead(req.user.id);
  res.json({ updated: n });
});
