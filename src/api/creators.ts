import api from '../api';

/* ─── DTOs (mirror server/src/services/creatorService.ts) ─── */

export interface CreatorPlatformDTO {
  platform: string;
  username: string;
  followerCount: number;
  profileUrl: string | null;
}

export interface CreatorDTO {
  id: string;
  userId: string;
  slug: string;
  name: string;
  bio: string | null;
  location: string | null;
  niche: string | null;
  isAvailable: boolean;
  isVerified: boolean;
  trustScore: number;
  xp: number;
  avatarUrl: string | null;
  role: string;
  platforms: CreatorPlatformDTO[];
  followerCount: number;
}

export interface ListCreatorsQuery {
  q?: string;
  niche?: string;
  platform?: string; // INSTAGRAM | YOUTUBE | TIKTOK
  available?: boolean;
  limit?: number;
  offset?: number;
}

/* ─── Endpoints ─── */

export async function listCreators(params: ListCreatorsQuery = {}): Promise<CreatorDTO[]> {
  const res = await api.get<CreatorDTO[]>('/creators', { params });
  return res.data;
}

export async function getCreatorBySlug(slug: string): Promise<CreatorDTO> {
  const res = await api.get<CreatorDTO>(`/creators/${encodeURIComponent(slug)}`);
  return res.data;
}

export async function followCreator(userId: string): Promise<void> {
  await api.post(`/creators/${userId}/follow`);
}

export async function unfollowCreator(userId: string): Promise<void> {
  await api.delete(`/creators/${userId}/follow`);
}

export async function listMyFollows(): Promise<CreatorDTO[]> {
  const res = await api.get<CreatorDTO[]>('/me/follows');
  return res.data;
}
