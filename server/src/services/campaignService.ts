import { query, getClient } from '../db';
import * as notifications from './notificationService';

/* ─── DTOs ─── */

export interface CampaignDTO {
  id: string;
  ownerId: string;            // users.id of the agency/brand that owns the campaign
  ownerName: string | null;
  title: string;
  description: string | null;
  brief: string | null;
  niche: string | null;
  platforms: string[];
  budgetCents: number;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'SETTLED' | 'CANCELLED';
  isPublic: boolean;
  deadlineAt: string | null;
  createdAt: string;
  applicationCount: number;   // in marketplace + owner views
}

export interface ApplicationDTO {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  pitch: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  // When loaded for a single campaign, we enrich with creator info
  creator?: {
    slug: string | null;
    fullName: string;
    avatarUrl: string | null;
    niche: string | null;
    trustScore: number;
    xp: number;
  };
}

/* ─── helpers ─── */

const mapCampaign = (r: any): CampaignDTO => ({
  id: r.id,
  ownerId: r.creator_id,
  ownerName: r.owner_name || null,
  title: r.title,
  description: r.description,
  brief: r.brief,
  niche: r.niche,
  platforms: r.platforms || [],
  budgetCents: Number(r.budget_cents) || 0,
  currency: r.currency,
  status: r.status,
  isPublic: r.is_public,
  deadlineAt: r.deadline_at,
  createdAt: r.created_at,
  applicationCount: Number(r.application_count) || 0,
});

/* ─── Marketplace ─── */

export interface MarketplaceFilters {
  q?: string;
  niche?: string;
  platform?: string;          // INSTAGRAM | YOUTUBE | TIKTOK
  limit?: number;
  offset?: number;
}

export const listMarketplaceCampaigns = async (f: MarketplaceFilters): Promise<CampaignDTO[]> => {
  const params: any[] = [];
  const where: string[] = [
    `c.is_public = true`,
    `c.status = 'ACTIVE'`,
  ];

  if (f.q) {
    params.push(`%${f.q}%`);
    const pos = params.length;
    where.push(`(c.title ILIKE $${pos} OR c.description ILIKE $${pos} OR c.brief ILIKE $${pos})`);
  }
  if (f.niche) {
    params.push(f.niche);
    where.push(`c.niche = $${params.length}`);
  }
  if (f.platform) {
    params.push(f.platform.toUpperCase());
    where.push(`$${params.length} = ANY(c.platforms)`);
  }

  const limit  = Math.min(100, Math.max(1, f.limit ?? 48));
  const offset = Math.max(0, f.offset ?? 0);
  params.push(limit, offset);

  const sql = `
    SELECT
      c.*,
      p.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.campaign_id = c.id) AS application_count
    FROM   campaigns c
    LEFT JOIN profiles p ON p.user_id = c.creator_id
    WHERE  ${where.join(' AND ')}
    ORDER BY c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows.map(mapCampaign);
};

export const getCampaignById = async (id: string): Promise<CampaignDTO | null> => {
  const res = await query(`
    SELECT c.*, p.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.campaign_id = c.id) AS application_count
    FROM   campaigns c
    LEFT JOIN profiles p ON p.user_id = c.creator_id
    WHERE  c.id = $1
    LIMIT 1
  `, [id]);
  if (res.rowCount === 0) return null;
  return mapCampaign(res.rows[0]);
};

/* ─── Agency create/update ─── */

export interface CreateCampaignInput {
  ownerId: string;
  title: string;
  description?: string;
  brief?: string;
  niche?: string;
  platforms?: string[];
  budgetCents?: number;
  deadlineAt?: string;
  isPublic?: boolean;
  status?: 'DRAFT' | 'ACTIVE';
}

export const createCampaign = async (input: CreateCampaignInput): Promise<CampaignDTO> => {
  const res = await query(
    `INSERT INTO campaigns
       (creator_id, title, description, brief, niche, platforms, budget_cents, deadline_at, is_public, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.ownerId,
      input.title,
      input.description ?? null,
      input.brief ?? null,
      input.niche ?? null,
      input.platforms ?? [],
      input.budgetCents ?? 0,
      input.deadlineAt ?? null,
      input.isPublic ?? false,
      input.status ?? 'DRAFT',
    ],
  );
  const campaign = mapCampaign({ ...res.rows[0], owner_name: null, application_count: 0 });

  // Notify agency's roster when going public
  if (campaign.isPublic && campaign.status === 'ACTIVE') {
    void fanOutCampaignPublished(campaign);
  }
  return campaign;
};

const fanOutCampaignPublished = async (campaign: CampaignDTO) => {
  const roster = await query(
    `SELECT creator_id FROM agency_creators WHERE agency_id = $1 AND status = 'ACCEPTED'`,
    [campaign.ownerId],
  );
  await Promise.all(roster.rows.map(r => notifications.emit({
    userId: r.creator_id,
    type:   'CAMPAIGN_PUBLISHED',
    title:  `New campaign from your agency`,
    body:   campaign.title,
    link:   `/campaigns/${campaign.id}`,
    metadata: { campaignId: campaign.id },
  })));
};

/* ─── Applications ─── */

export const apply = async (
  campaignId: string,
  creatorId: string,
  pitch: string | null,
): Promise<{ ok: true; row: any } | { ok: false; reason: 'not_found' | 'not_public' | 'duplicate' | 'inactive' }> => {
  const campaign = await query(
    `SELECT id, creator_id AS owner_id, title, is_public, status FROM campaigns WHERE id = $1`,
    [campaignId],
  );
  if (campaign.rowCount === 0) return { ok: false, reason: 'not_found' };
  if (!campaign.rows[0].is_public) return { ok: false, reason: 'not_public' };
  if (campaign.rows[0].status !== 'ACTIVE') return { ok: false, reason: 'inactive' };

  try {
    const res = await query(
      `INSERT INTO applications (campaign_id, influencer_id, status, pitch)
       VALUES ($1, $2, 'PENDING', $3)
       RETURNING *`,
      [campaignId, creatorId, pitch],
    );

    // Notify the agency owner
    void notifications.emit({
      userId: campaign.rows[0].owner_id,
      type:   'APPLICATION_RECEIVED',
      title:  'New application',
      body:   `Someone applied to "${campaign.rows[0].title}"`,
      link:   `/campaigns/${campaignId}`,
      metadata: { campaignId, applicationId: res.rows[0].id, creatorId },
    });

    return { ok: true, row: res.rows[0] };
  } catch (err: any) {
    if (err?.code === '23505') return { ok: false, reason: 'duplicate' };
    throw err;
  }
};

export const listApplicationsForCampaign = async (
  campaignId: string,
): Promise<ApplicationDTO[]> => {
  const res = await query(`
    SELECT a.id, a.campaign_id, a.influencer_id, a.status, a.pitch, a.created_at, a.updated_at, a.reviewed_at,
           p.slug, p.full_name, p.avatar_url, p.niche, p.trust_score, p.xp
    FROM   applications a
    JOIN   profiles p ON p.user_id = a.influencer_id
    WHERE  a.campaign_id = $1
    ORDER BY CASE a.status WHEN 'PENDING' THEN 0 WHEN 'ACCEPTED' THEN 1 ELSE 2 END,
             a.created_at DESC
  `, [campaignId]);
  return res.rows.map(r => ({
    id: r.id,
    campaignId: r.campaign_id,
    influencerId: r.influencer_id,
    status: r.status,
    pitch: r.pitch,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    reviewedAt: r.reviewed_at,
    creator: {
      slug: r.slug,
      fullName: r.full_name,
      avatarUrl: r.avatar_url,
      niche: r.niche,
      trustScore: r.trust_score,
      xp: r.xp,
    },
  }));
};

export const listMyApplications = async (creatorId: string): Promise<ApplicationDTO[]> => {
  const res = await query(`
    SELECT a.id, a.campaign_id, a.influencer_id, a.status, a.pitch, a.created_at, a.updated_at, a.reviewed_at
    FROM   applications a
    WHERE  a.influencer_id = $1
    ORDER BY a.created_at DESC
  `, [creatorId]);
  return res.rows.map(r => ({
    id: r.id,
    campaignId: r.campaign_id,
    influencerId: r.influencer_id,
    status: r.status,
    pitch: r.pitch,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    reviewedAt: r.reviewed_at,
  }));
};

/**
 * Update application status (agency-only). Runs in a transaction so we can
 * verify the caller owns the campaign before mutating.
 */
export const reviewApplication = async (
  reviewerId: string,
  applicationId: string,
  action: 'accept' | 'reject',
): Promise<{ ok: true; row: any } | { ok: false; reason: 'not_found' | 'forbidden' | 'already_reviewed' }> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const appRes = await client.query(`
      SELECT a.id, a.status, a.campaign_id, a.influencer_id, c.creator_id AS owner_id, c.title
      FROM   applications a
      JOIN   campaigns    c ON c.id = a.campaign_id
      WHERE  a.id = $1
      FOR UPDATE
    `, [applicationId]);

    if (appRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found' };
    }
    const row = appRes.rows[0];
    if (row.owner_id !== reviewerId) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'forbidden' };
    }
    if (row.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'already_reviewed' };
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    const updated = await client.query(`
      UPDATE applications
      SET    status = $1, reviewed_at = NOW(), reviewer_id = $2
      WHERE  id = $3
      RETURNING *
    `, [newStatus, reviewerId, applicationId]);

    await client.query('COMMIT');

    void notifications.emit({
      userId: row.influencer_id,
      type:   action === 'accept' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
      title:  action === 'accept' ? 'Your application was accepted' : 'Your application was declined',
      body:   `"${row.title}"`,
      link:   `/campaigns/${row.campaign_id}`,
      metadata: { campaignId: row.campaign_id, applicationId },
    });

    return { ok: true, row: updated.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
};
