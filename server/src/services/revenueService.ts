import { query } from '../db';

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

/** Monthly earnings for a creator — aggregated from released milestones via the ledger. */
export const creatorMonthlyEarnings = async (userId: string, year?: number): Promise<MonthlyEarning[]> => {
  const params: any[] = [userId];
  let where = 'creator_id = $1';
  if (year) {
    params.push(year);
    where += ` AND EXTRACT(YEAR FROM month) = $${params.length}`;
  }
  const res = await query(
    `SELECT month, amount_cents, entry_count
       FROM creator_monthly_earnings
      WHERE ${where}
   ORDER BY month`,
    params,
  );
  return res.rows.map(r => ({
    month: new Date(r.month).toISOString().slice(0, 7),
    amountCents: Number(r.amount_cents) || 0,
    entryCount:  Number(r.entry_count) || 0,
  }));
};

/** Agency ranking — top by total_paid_cents, tie-break by roster_size desc. */
export const agencyLeaderboard = async (limit = 25): Promise<AgencyLeaderboardRow[]> => {
  const res = await query(
    `SELECT *
       FROM agency_metrics
   ORDER BY total_paid_cents DESC, roster_size DESC, agency_name ASC
      LIMIT $1`,
    [limit],
  );
  return res.rows.map((r: any, i: number) => ({
    rank:           i + 1,
    agencyId:       r.agency_id,
    agencyName:     r.agency_name,
    totalPaidCents: Number(r.total_paid_cents) || 0,
    rosterSize:     Number(r.roster_size) || 0,
    campaignCount:  Number(r.campaign_count) || 0,
    settledCount:   Number(r.settled_count) || 0,
    acceptedApps:   Number(r.accepted_apps) || 0,
  }));
};
