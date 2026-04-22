/**
 * badgeService.ts — Sprint 4: Creator badge management
 *
 * Badge codes:
 *   FIRST_DEAL     — First accepted application
 *   CAMPAIGN_5     — 5 completed campaigns
 *   TRUSTED        — Trust score ≥ 80
 *   ON_TIME_STREAK — 10 on-time milestone deliveries
 *   TOP_10         — Ranked in top 10 leaderboard (manually awarded)
 */

import { query } from '../db';

export interface Badge {
  creatorId: string;
  badgeCode: string;
  awardedAt: string;
}

export const BADGE_META: Record<string, { label: string; emoji: string; description: string }> = {
  FIRST_DEAL:     { label: 'First Deal',     emoji: '🤝', description: 'Completed your first collaboration' },
  CAMPAIGN_5:     { label: 'Rising Star',    emoji: '⭐', description: 'Completed 5 campaigns successfully' },
  TRUSTED:        { label: 'Trusted',        emoji: '🛡️', description: 'Trust score reached 80 or above' },
  ON_TIME_STREAK: { label: 'On-Time Pro',    emoji: '⚡', description: '10 milestones delivered on time' },
  TOP_10:         { label: 'Top Creator',    emoji: '🏆', description: 'Ranked in the top 10 leaderboard' },
};

/** List all badges for a creator (by userId). */
export const listForUser = async (userId: string): Promise<Badge[]> => {
  const res = await query(
    `SELECT creator_id, badge_code, awarded_at
       FROM creator_badges
      WHERE creator_id = $1
      ORDER BY awarded_at ASC`,
    [userId],
  );
  return res.rows.map(r => ({
    creatorId: r.creator_id,
    badgeCode: r.badge_code,
    awardedAt: r.awarded_at,
  }));
};

/** Manually award a badge (idempotent). */
export const award = async (userId: string, badgeCode: string): Promise<void> => {
  await query(
    `INSERT INTO creator_badges (creator_id, badge_code)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, badgeCode],
  );
};
