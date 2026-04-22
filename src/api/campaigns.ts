import api from '../api';

/* ─── DTOs ─── */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'SETTLED' | 'CANCELLED';

export interface CampaignDTO {
  id: string;
  ownerId: string;
  ownerName: string | null;
  title: string;
  description: string | null;
  brief: string | null;
  niche: string | null;
  platforms: string[];
  budgetCents: number;
  currency: string;
  status: CampaignStatus;
  isPublic: boolean;
  deadlineAt: string | null;
  createdAt: string;
  applicationCount: number;
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ApplicationDTO {
  id: string;
  campaignId: string;
  influencerId: string;
  status: ApplicationStatus;
  pitch: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  creator?: {
    slug: string | null;
    fullName: string;
    avatarUrl: string | null;
    niche: string | null;
    trustScore: number;
    xp: number;
  };
}

/* ─── Marketplace ─── */

export async function listMarketplace(params: {
  q?: string; niche?: string; platform?: string; limit?: number; offset?: number;
} = {}): Promise<CampaignDTO[]> {
  const res = await api.get<CampaignDTO[]>('/campaigns/marketplace', { params });
  return res.data;
}

export async function getCampaign(id: string): Promise<CampaignDTO> {
  const res = await api.get<CampaignDTO>(`/campaigns/${id}`);
  return res.data;
}

/* ─── Agency ─── */

export async function createCampaign(input: {
  title: string;
  description?: string;
  brief?: string;
  niche?: string;
  platforms?: string[];
  budgetCents?: number;
  deadlineAt?: string;
  isPublic?: boolean;
  status?: 'DRAFT' | 'ACTIVE';
}): Promise<CampaignDTO> {
  const res = await api.post<CampaignDTO>('/campaigns', input);
  return res.data;
}

export async function listApplicationsForCampaign(id: string): Promise<ApplicationDTO[]> {
  const res = await api.get<ApplicationDTO[]>(`/campaigns/${id}/applications`);
  return res.data;
}

export async function reviewApplication(applicationId: string, action: 'accept' | 'reject'): Promise<ApplicationDTO> {
  const res = await api.post<ApplicationDTO>(`/applications/${applicationId}/review`, { action });
  return res.data;
}

/* ─── Creator ─── */

export async function applyToCampaign(campaignId: string, pitch?: string): Promise<ApplicationDTO> {
  const res = await api.post<ApplicationDTO>(`/campaigns/${campaignId}/apply`, pitch ? { pitch } : {});
  return res.data;
}

export async function listMyApplications(): Promise<ApplicationDTO[]> {
  const res = await api.get<ApplicationDTO[]>('/me/applications');
  return res.data;
}
