import api from '../api';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RELEASED';

export interface MilestoneDTO {
  id: string;
  campaignId: string;
  applicationId: string | null;
  title: string;
  description: string | null;
  amountCents: number;
  position: number;
  status: MilestoneStatus;
  dueAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listForApplication(appId: string): Promise<MilestoneDTO[]> {
  const res = await api.get<MilestoneDTO[]>(`/applications/${appId}/milestones`);
  return res.data;
}

export async function createMilestone(appId: string, data: {
  title: string; description?: string; amountCents: number; dueAt?: string; position?: number;
}): Promise<MilestoneDTO> {
  const res = await api.post<MilestoneDTO>(`/applications/${appId}/milestones`, data);
  return res.data;
}

export async function submitMilestone(id: string): Promise<MilestoneDTO> {
  const res = await api.post<MilestoneDTO>(`/milestones/${id}/submit`);
  return res.data;
}

export async function releaseMilestone(id: string): Promise<MilestoneDTO> {
  const res = await api.post<MilestoneDTO>(`/milestones/${id}/release`);
  return res.data;
}
