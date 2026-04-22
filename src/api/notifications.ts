import api from '../api';

export type NotificationType =
  | 'ROSTER_INVITE' | 'ROSTER_ACCEPTED' | 'ROSTER_REJECTED'
  | 'APPLICATION_RECEIVED' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED'
  | 'MILESTONE_SUBMITTED' | 'MILESTONE_RELEASED'
  | 'CAMPAIGN_PUBLISHED';

export interface NotificationDTO {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(params: { limit?: number; offset?: number; unread?: boolean } = {}): Promise<NotificationDTO[]> {
  const res = await api.get<NotificationDTO[]>('/me/notifications', { params });
  return res.data;
}

export async function unreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>('/me/notifications/unread-count');
  return res.data.count;
}

export async function markRead(id: string): Promise<void> {
  await api.post(`/me/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.post('/me/notifications/read-all');
}
