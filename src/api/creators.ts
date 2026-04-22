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

/* ─── Sprint 4: activity, leaderboard, availability ─── */

export interface ActivityPoint {
  date: string;   // YYYY-MM-DD
  count: number;
}

export async function getCreatorActivity(slug: string, year?: number): Promise<ActivityPoint[]> {
  const res = await api.get<ActivityPoint[]>(`/creators/${encodeURIComponent(slug)}/activity`, {
    params: year ? { year } : undefined,
  });
  return res.data;
}

export interface LeaderboardEntryDTO extends CreatorDTO {
  rank: number;
  acceptedApplications: number;
  completedCampaigns: number;
}

export async function getLeaderboard(limit = 25): Promise<LeaderboardEntryDTO[]> {
  const res = await api.get<LeaderboardEntryDTO[]>('/creators/leaderboard', { params: { limit } });
  return res.data;
}

export async function setMyAvailability(available: boolean): Promise<{ isAvailable: boolean }> {
  const res = await api.patch<{ isAvailable: boolean }>('/me/availability', { available });
  return res.data;
}

export async function recomputeCreator(slug: string): Promise<CreatorDTO> {
  const res = await api.post<CreatorDTO>(`/creators/${encodeURIComponent(slug)}/recompute`);
  return res.data;
}

/* ─── Sprint 4: Badges ─── */

export interface BadgeDTO {
  creatorId: string;
  badgeCode: string;
  awardedAt: string;
}

export const BADGE_META: Record<string, { label: string; emoji: string; description: string }> = {
  FIRST_DEAL:     { label: 'First Deal',  emoji: '🤝', description: 'Completed your first collaboration' },
  CAMPAIGN_5:     { label: 'Rising Star', emoji: '⭐', description: 'Completed 5 campaigns successfully' },
  TRUSTED:        { label: 'Trusted',     emoji: '🛡️', description: 'Trust score reached 80 or above' },
  ON_TIME_STREAK: { label: 'On-Time Pro', emoji: '⚡', description: '10 milestones delivered on time' },
  TOP_10:         { label: 'Top Creator', emoji: '🏆', description: 'Ranked in the top 10 leaderboard' },
};

export async function getCreatorBadges(slug: string): Promise<BadgeDTO[]> {
  const res = await api.get<BadgeDTO[]>(`/creators/${encodeURIComponent(slug)}/badges`);
  return res.data;
}
