import { query } from '../db';
import { AgencyRelationStatus, TaskStatus } from '../types/agency';
import * as notifications from './notificationService';

/**
 * Invite a creator onto the agency's roster. Requires the target to actually
 * be an INFLUENCER user — agencies shouldn't roster other agencies/brands.
 * Returns { status, reason } so the controller can map to HTTP codes.
 */
export const inviteCreator = async (
  agencyId: string,
  creatorId: string,
): Promise<{ ok: true; row: any } | { ok: false; reason: 'not_found' | 'wrong_role' }> => {
  const target = await query(
    `SELECT id, role FROM users WHERE id = $1 LIMIT 1`,
    [creatorId],
  );
  if (target.rowCount === 0) return { ok: false, reason: 'not_found' };
  if (target.rows[0].role !== 'INFLUENCER') return { ok: false, reason: 'wrong_role' };

  const result = await query(
    `INSERT INTO agency_creators (agency_id, creator_id, status)
     VALUES ($1, $2, 'INVITED')
     ON CONFLICT (agency_id, creator_id) DO UPDATE
       SET status = 'INVITED', invited_at = NOW()
     RETURNING *`,
    [agencyId, creatorId],
  );

  // Look up the agency's display name for the notification
  const agency = await query(
    `SELECT COALESCE(p.company_name, p.full_name, u.email) AS name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [agencyId],
  );
  void notifications.emit({
    userId: creatorId,
    type:   'ROSTER_INVITE',
    title:  'Agency roster invite',
    body:   `${agency.rows[0]?.name || 'An agency'} invited you to join their roster.`,
    link:   '/profile',
    metadata: { agencyId },
  });

  return { ok: true, row: result.rows[0] };
};

/**
 * Accept / reject a pending invitation. Returns null when there is no
 * invitation to respond to — the controller should then return 404.
 */
export const respondToInvitation = async (
  agencyId: string,
  creatorId: string,
  accept: boolean,
): Promise<any | null> => {
  const status: AgencyRelationStatus = accept ? 'ACCEPTED' : 'REJECTED';
  const result = await query(
    `UPDATE agency_creators
        SET status    = $3,
            joined_at = CASE WHEN $4 = true THEN NOW() ELSE NULL END
      WHERE agency_id = $1 AND creator_id = $2
      RETURNING *`,
    [agencyId, creatorId, status, accept],
  );
  if (result.rowCount === 0) return null;

  // Notify the agency of the response
  const creator = await query(
    `SELECT COALESCE(p.full_name, u.email) AS name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [creatorId],
  );
  void notifications.emit({
    userId: agencyId,
    type:   accept ? 'ROSTER_ACCEPTED' : 'ROSTER_REJECTED',
    title:  accept ? 'Roster invite accepted' : 'Roster invite declined',
    body:   `${creator.rows[0]?.name || 'A creator'} ${accept ? 'joined' : 'declined'} your agency roster.`,
    link:   '/roster',
    metadata: { creatorId },
  });

  return result.rows[0];
};

/**
 * Agency's accepted roster with creator profile + aggregated campaign stats.
 *
 * Performance numbers come from applications → analytics_data (not campaigns,
 * whose creator_id is the agency owner). Campaigns are filtered to those
 * owned by the current agency to keep metrics scoped.
 */
export const getRoster = async (agencyId: string) => {
  const result = await query(
    `
    SELECT
      ac.agency_id,
      ac.creator_id,
      ac.status,
      ac.role_in_agency,
      ac.invited_at,
      ac.joined_at,
      p.slug,
      p.full_name,
      p.avatar_url,
      p.niche,
      p.trust_score,
      p.xp,
      COALESCE((
        SELECT SUM(ad.reach)
        FROM applications app
        JOIN campaigns c ON c.id = app.campaign_id
        LEFT JOIN analytics_data ad ON ad.application_id = app.id
        WHERE app.influencer_id = ac.creator_id
          AND c.creator_id = ac.agency_id
      ), 0)::BIGINT AS total_reach,
      COALESCE((
        SELECT SUM(ad.conversions)
        FROM applications app
        JOIN campaigns c ON c.id = app.campaign_id
        LEFT JOIN analytics_data ad ON ad.application_id = app.id
        WHERE app.influencer_id = ac.creator_id
          AND c.creator_id = ac.agency_id
      ), 0)::BIGINT AS total_conversions,
      COALESCE((
        SELECT COUNT(DISTINCT app.campaign_id)
        FROM applications app
        JOIN campaigns c ON c.id = app.campaign_id
        WHERE app.influencer_id = ac.creator_id
          AND c.creator_id = ac.agency_id
      ), 0)::INTEGER AS campaign_count
    FROM agency_creators ac
    JOIN profiles p ON p.user_id = ac.creator_id
    WHERE ac.agency_id = $1
      AND ac.status IN ('INVITED','ACCEPTED')
    ORDER BY ac.status ASC, p.full_name ASC
    `,
    [agencyId],
  );
  return result.rows;
};

/* ─── Notes ─── */

export const addNote = async (
  agencyId: string,
  creatorId: string,
  authorId: string,
  body: string,
  isPinned: boolean = false,
) => {
  const result = await query(
    `INSERT INTO agency_notes (agency_id, creator_id, author_id, body, is_pinned)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [agencyId, creatorId, authorId, body, isPinned],
  );
  return result.rows[0];
};

export const getNotes = async (agencyId: string, creatorId: string) => {
  const result = await query(
    `SELECT n.*, p.full_name AS author_name
       FROM agency_notes n
  LEFT JOIN profiles p ON n.author_id = p.user_id
      WHERE n.agency_id = $1 AND n.creator_id = $2
   ORDER BY n.is_pinned DESC, n.created_at DESC`,
    [agencyId, creatorId],
  );
  return result.rows;
};

/* ─── Tasks ─── */

export const createTask = async (data: {
  agencyId: string;
  creatorId?: string;
  campaignId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  dueAt?: string;
}) => {
  const result = await query(
    `INSERT INTO tasks (agency_id, creator_id, campaign_id, assignee_id, title, description, due_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.agencyId,
      data.creatorId  || null,
      data.campaignId || null,
      data.assigneeId || null,
      data.title,
      data.description || null,
      data.dueAt || null,
    ],
  );
  return result.rows[0];
};

export const updateTaskStatus = async (taskId: string, agencyId: string, status: TaskStatus) => {
  const result = await query(
    `UPDATE tasks SET status = $1 WHERE id = $2 AND agency_id = $3 RETURNING *`,
    [status, taskId, agencyId],
  );
  return result.rowCount ? result.rows[0] : null;
};

export const getTasks = async (
  agencyId: string,
  filters: { creatorId?: string; campaignId?: string } = {},
) => {
  let sql = `SELECT * FROM tasks WHERE agency_id = $1`;
  const params: any[] = [agencyId];

  if (filters.creatorId) {
    params.push(filters.creatorId);
    sql += ` AND creator_id = $${params.length}`;
  }
  if (filters.campaignId) {
    params.push(filters.campaignId);
    sql += ` AND campaign_id = $${params.length}`;
  }
  sql += ` ORDER BY due_at ASC NULLS LAST, created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
};
