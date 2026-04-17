import { query } from '../db';

/**
 * Public creator DTO — safe to expose on /u/:slug endpoints.
 * Only carries fields meant for public consumption.
 */
export interface PublicCreatorDTO {
  id: string;            // profile id (not user id)
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
  platforms: Array<{
    platform: string;
    username: string;
    followerCount: number;
    profileUrl: string | null;
  }>;
  followerCount: number;  // on-platform followers (inside Imbass)
}

export interface ListCreatorsFilters {
  q?: string;
  niche?: string;
  platform?: string;
  available?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List creators — only INFLUENCER users. Supports q (name/bio/location),
 * niche, platform, availability filters.
 */
export const listCreators = async (filters: ListCreatorsFilters): Promise<PublicCreatorDTO[]> => {
  const params: any[] = [];
  const where: string[] = [`u.role = 'INFLUENCER'`, `p.slug IS NOT NULL`];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const pos = params.length;
    where.push(`(p.full_name ILIKE $${pos} OR p.bio ILIKE $${pos} OR p.location ILIKE $${pos} OR p.slug ILIKE $${pos})`);
  }
  if (filters.niche) {
    params.push(filters.niche);
    where.push(`p.niche = $${params.length}`);
  }
  if (filters.available !== undefined) {
    params.push(filters.available);
    where.push(`p.is_available = $${params.length}`);
  }
  if (filters.platform) {
    params.push(filters.platform.toUpperCase());
    where.push(`EXISTS (SELECT 1 FROM social_accounts sa WHERE sa.profile_id = p.id AND sa.platform = $${params.length})`);
  }

  const limit = Math.min(100, Math.max(1, filters.limit ?? 48));
  const offset = Math.max(0, filters.offset ?? 0);
  params.push(limit, offset);

  const sql = `
    SELECT
      p.id, p.user_id, p.slug, p.full_name, p.bio, p.location, p.niche,
      p.is_available, p.is_verified, p.trust_score, p.xp, p.avatar_url,
      u.role,
      COALESCE(
        (SELECT json_agg(json_build_object(
            'platform', sa.platform,
            'username', sa.username,
            'followerCount', sa.follower_count,
            'profileUrl', sa.profile_url
          ) ORDER BY sa.follower_count DESC)
         FROM social_accounts sa WHERE sa.profile_id = p.id),
        '[]'::json
      ) AS platforms,
      COALESCE(
        (SELECT SUM(follower_count)::BIGINT FROM social_accounts sa WHERE sa.profile_id = p.id),
        0
      ) AS follower_count
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY p.xp DESC, p.full_name ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const res = await query(sql, params);
  return res.rows.map(mapRow);
};

/** Public profile lookup by slug. Returns null if not found. */
export const getCreatorBySlug = async (slug: string): Promise<PublicCreatorDTO | null> => {
  const res = await query(`
    SELECT
      p.id, p.user_id, p.slug, p.full_name, p.bio, p.location, p.niche,
      p.is_available, p.is_verified, p.trust_score, p.xp, p.avatar_url,
      u.role,
      COALESCE(
        (SELECT json_agg(json_build_object(
            'platform', sa.platform,
            'username', sa.username,
            'followerCount', sa.follower_count,
            'profileUrl', sa.profile_url
          ) ORDER BY sa.follower_count DESC)
         FROM social_accounts sa WHERE sa.profile_id = p.id),
        '[]'::json
      ) AS platforms,
      COALESCE(
        (SELECT SUM(follower_count)::BIGINT FROM social_accounts sa WHERE sa.profile_id = p.id),
        0
      ) AS follower_count
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.slug = $1 AND u.role = 'INFLUENCER'
    LIMIT 1
  `, [slug]);

  if (res.rowCount === 0) return null;
  return mapRow(res.rows[0]);
};

/**
 * Follow a creator by the target user's id.
 * Idempotent — inserting the same pair twice is a no-op.
 */
export const follow = async (followerId: string, followingUserId: string): Promise<void> => {
  if (followerId === followingUserId) {
    throw new Error('Cannot follow yourself');
  }
  await query(
    `INSERT INTO follows (follower_id, following_user_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, following_user_id) DO NOTHING`,
    [followerId, followingUserId]
  );
};

export const unfollow = async (followerId: string, followingUserId: string): Promise<void> => {
  await query(
    `DELETE FROM follows WHERE follower_id = $1 AND following_user_id = $2`,
    [followerId, followingUserId]
  );
};

/** Current user's followed creators — returns the same PublicCreatorDTO shape. */
export const listFollowedCreators = async (followerId: string): Promise<PublicCreatorDTO[]> => {
  const res = await query(`
    SELECT
      p.id, p.user_id, p.slug, p.full_name, p.bio, p.location, p.niche,
      p.is_available, p.is_verified, p.trust_score, p.xp, p.avatar_url,
      u.role,
      COALESCE(
        (SELECT json_agg(json_build_object(
            'platform', sa.platform,
            'username', sa.username,
            'followerCount', sa.follower_count,
            'profileUrl', sa.profile_url
          ) ORDER BY sa.follower_count DESC)
         FROM social_accounts sa WHERE sa.profile_id = p.id),
        '[]'::json
      ) AS platforms,
      COALESCE(
        (SELECT SUM(follower_count)::BIGINT FROM social_accounts sa WHERE sa.profile_id = p.id),
        0
      ) AS follower_count
    FROM follows f
    JOIN profiles p ON p.user_id = f.following_user_id
    JOIN users    u ON u.id = p.user_id
    WHERE f.follower_id = $1
    ORDER BY f.created_at DESC
  `, [followerId]);

  return res.rows.map(mapRow);
};

/* ─── mapper ─── */
function mapRow(r: any): PublicCreatorDTO {
  return {
    id: r.id,
    userId: r.user_id,
    slug: r.slug,
    name: r.full_name,
    bio: r.bio,
    location: r.location,
    niche: r.niche,
    isAvailable: r.is_available,
    isVerified: r.is_verified,
    trustScore: r.trust_score,
    xp: r.xp,
    avatarUrl: r.avatar_url,
    role: r.role,
    platforms: r.platforms || [],
    followerCount: Number(r.follower_count) || 0,
  };
}
