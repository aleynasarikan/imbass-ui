import { query, getClient } from '../db';
import * as notifications from './notificationService';
import { emitTo } from '../socket';

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

const mapRow = (r: any): MilestoneDTO => ({
  id: r.id,
  campaignId: r.campaign_id,
  applicationId: r.application_id,
  title: r.title,
  description: r.description,
  amountCents: Number(r.amount_cents) || 0,
  position: Number(r.position) || 0,
  status: r.status,
  dueAt: r.due_at,
  submittedAt: r.submitted_at,
  approvedAt: r.approved_at,
  releasedAt: r.released_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/* ─── Queries ─── */

export const listForApplication = async (applicationId: string): Promise<MilestoneDTO[]> => {
  const res = await query(
    `SELECT * FROM milestones WHERE application_id = $1 ORDER BY position ASC, created_at ASC`,
    [applicationId],
  );
  return res.rows.map(mapRow);
};

export const getById = async (id: string): Promise<MilestoneDTO | null> => {
  const res = await query(`SELECT * FROM milestones WHERE id = $1`, [id]);
  return res.rowCount === 0 ? null : mapRow(res.rows[0]);
};

/**
 * Returns campaign owner + application influencer for permission checks.
 * Null when either side is missing.
 */
export const getContext = async (milestoneId: string): Promise<{
  milestoneId: string;
  campaignId: string;
  applicationId: string | null;
  status: MilestoneStatus;
  ownerId: string;
  creatorId: string | null;
} | null> => {
  const res = await query(`
    SELECT m.id, m.campaign_id, m.application_id, m.status,
           c.creator_id AS owner_id,
           a.influencer_id AS creator_id
      FROM milestones m
      JOIN campaigns   c ON c.id = m.campaign_id
 LEFT JOIN applications a ON a.id = m.application_id
     WHERE m.id = $1
  `, [milestoneId]);
  if (res.rowCount === 0) return null;
  const r = res.rows[0];
  return {
    milestoneId: r.id,
    campaignId:  r.campaign_id,
    applicationId: r.application_id,
    status:        r.status,
    ownerId:       r.owner_id,
    creatorId:     r.creator_id,
  };
};

/* ─── Mutations ─── */

export interface CreateMilestoneInput {
  campaignId: string;
  applicationId: string;
  title: string;
  description?: string;
  amountCents: number;
  dueAt?: string;
  position?: number;
}

export const create = async (input: CreateMilestoneInput): Promise<MilestoneDTO> => {
  const res = await query(`
    INSERT INTO milestones (campaign_id, application_id, title, description, amount_cents, position, due_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    input.campaignId,
    input.applicationId,
    input.title,
    input.description ?? null,
    input.amountCents,
    input.position ?? 0,
    input.dueAt ?? null,
  ]);
  return mapRow(res.rows[0]);
};

export const submit = async (milestoneId: string): Promise<MilestoneDTO> => {
  const res = await query(`
    UPDATE milestones
       SET status = 'SUBMITTED', submitted_at = NOW()
     WHERE id = $1
     RETURNING *
  `, [milestoneId]);
  return mapRow(res.rows[0]);
};

/**
 * Approve + release. Calls the DB function release_milestone() which wraps
 * ledger entries in a transaction (double-entry: DEBIT agency escrow,
 * CREDIT creator balance).
 */
export const approveAndRelease = async (milestoneId: string): Promise<MilestoneDTO> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('SELECT release_milestone($1)', [milestoneId]);
    const res = await client.query(`SELECT * FROM milestones WHERE id = $1`, [milestoneId]);
    await client.query('COMMIT');
    return mapRow(res.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
};

/* ─── Notifications helpers ─── */

export const emitSubmitted = async (milestone: MilestoneDTO, agencyId: string) => {
  await notifications.emit({
    userId: agencyId,
    type:   'MILESTONE_SUBMITTED',
    title:  'Milestone submitted',
    body:   `A creator marked "${milestone.title}" as ready for review.`,
    link:   `/my-campaigns`,
    metadata: { milestoneId: milestone.id, campaignId: milestone.campaignId },
  });
  // Real-time push (Sprint 3)
  emitTo(agencyId, 'milestone:update', { event: 'SUBMITTED', milestone });
};

export const emitReleased = async (milestone: MilestoneDTO, creatorId: string) => {
  await notifications.emit({
    userId: creatorId,
    type:   'MILESTONE_RELEASED',
    title:  'Milestone paid',
    body:   `${milestone.title} — $${(milestone.amountCents / 100).toFixed(2)} released to your balance.`,
    link:   `/profile`,
    metadata: { milestoneId: milestone.id, campaignId: milestone.campaignId },
  });
  // Real-time push (Sprint 3)
  emitTo(creatorId, 'milestone:update', { event: 'RELEASED', milestone });
};
