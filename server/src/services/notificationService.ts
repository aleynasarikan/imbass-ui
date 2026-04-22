import { query } from '../db';
import { emitTo } from '../socket';

export type NotificationType =
  | 'ROSTER_INVITE' | 'ROSTER_ACCEPTED' | 'ROSTER_REJECTED'
  | 'APPLICATION_RECEIVED' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED'
  | 'MILESTONE_SUBMITTED' | 'MILESTONE_RELEASED'
  | 'CAMPAIGN_PUBLISHED';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
}

/** Insert a notification AND push it live via Socket.IO. Fire-and-forget. */
export const emit = async (n: NotificationInput): Promise<void> => {
  try {
    const res = await query(
      `INSERT INTO notifications (user_id, type, title, body, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [n.userId, n.type, n.title, n.body ?? null, n.link ?? null, JSON.stringify(n.metadata ?? {})],
    );
    // Push real-time to the recipient's browser (Sprint 3)
    if (res.rows[0]) {
      emitTo(n.userId, 'notification', res.rows[0]);
    }
  } catch (err) {
    // Soft-fail — notifications are non-critical side effects
    console.error('[notifications] emit failed:', err);
  }
};

export interface ListOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export const list = async (userId: string, opts: ListOptions = {}) => {
  const limit  = Math.min(100, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);
  const where  = opts.unreadOnly ? 'AND is_read = false' : '';
  const res = await query(
    `SELECT id, user_id, type, title, body, link, metadata, is_read, created_at
       FROM notifications
      WHERE user_id = $1 ${where}
   ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return res.rows;
};

export const unreadCount = async (userId: string): Promise<number> => {
  const res = await query(
    `SELECT COUNT(*)::INTEGER AS n FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return res.rows[0]?.n ?? 0;
};

export const markRead = async (userId: string, notificationId: string): Promise<boolean> => {
  const res = await query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
    [notificationId, userId],
  );
  return (res.rowCount ?? 0) > 0;
};

export const markAllRead = async (userId: string): Promise<number> => {
  const res = await query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return res.rowCount ?? 0;
};
