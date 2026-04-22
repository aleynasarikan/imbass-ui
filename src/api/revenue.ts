import api from '../api';

export interface MonthlyEarning {
  month: string;        // YYYY-MM
  amountCents: number;
  entryCount: number;
}

export interface AgencyLeaderboardRow {
  rank: number;
  agencyId: string;
  agencyName: string;
  totalPaidCents: number;
  rosterSize: number;
  campaignCount: number;
  settledCount: number;
  acceptedApps: number;
}

export async function getCreatorEarnings(slug: string, year?: number): Promise<MonthlyEarning[]> {
  const res = await api.get<MonthlyEarning[]>(`/creators/${encodeURIComponent(slug)}/earnings`, {
    params: year ? { year } : undefined,
  });
  return res.data;
}

export async function getAgencyLeaderboard(limit = 25): Promise<AgencyLeaderboardRow[]> {
  const res = await api.get<AgencyLeaderboardRow[]>('/agencies/leaderboard', { params: { limit } });
  return res.data;
}
