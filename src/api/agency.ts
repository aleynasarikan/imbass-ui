import api from '../api';

/* ─── DTOs ─── */

export interface RosterMember {
  agency_id: string;
  creator_id: string;
  status: 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'TERMINATED';
  role_in_agency: string | null;
  invited_at: string;
  joined_at: string | null;
  slug: string | null;
  full_name: string;
  avatar_url: string | null;
  niche: string | null;
  trust_score: number;
  xp: number;
  total_reach: string | number;
  total_conversions: string | number;
  campaign_count: number;
}

export interface AgencyNote {
  id: string;
  agency_id: string;
  creator_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

export interface AgencyTask {
  id: string;
  agency_id: string;
  creator_id: string | null;
  campaign_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Endpoints ─── */

export async function getRoster(): Promise<RosterMember[]> {
  const res = await api.get<RosterMember[]>('/agency/roster');
  return res.data;
}

export async function inviteCreator(creatorId: string): Promise<RosterMember> {
  const res = await api.post<RosterMember>('/agency/invite', { creatorId });
  return res.data;
}

export async function respondToInvitation(agencyId: string, accept: boolean) {
  const res = await api.post('/agency/respond', { agencyId, accept });
  return res.data;
}

export async function addNote(creatorId: string, body: string, isPinned = false): Promise<AgencyNote> {
  const res = await api.post<AgencyNote>('/agency/notes', { creatorId, body, isPinned });
  return res.data;
}

export async function getNotes(creatorId: string): Promise<AgencyNote[]> {
  const res = await api.get<AgencyNote[]>(`/agency/notes/${creatorId}`);
  return res.data;
}

export async function createTask(data: {
  title: string;
  creatorId?: string;
  campaignId?: string;
  assigneeId?: string;
  description?: string;
  dueAt?: string;
}): Promise<AgencyTask> {
  const res = await api.post<AgencyTask>('/agency/tasks', data);
  return res.data;
}

export async function getTasks(filters: { creatorId?: string; campaignId?: string } = {}): Promise<AgencyTask[]> {
  const res = await api.get<AgencyTask[]>('/agency/tasks', { params: filters });
  return res.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<AgencyTask> {
  const res = await api.patch<AgencyTask>(`/agency/tasks/${id}`, { status });
  return res.data;
}
