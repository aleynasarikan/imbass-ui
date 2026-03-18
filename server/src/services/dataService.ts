import { query } from '../db';

export const getInfluencers = async () => {
  const result = await query(`
    SELECT 
      profiles.id, 
      profiles.full_name as name, 
      platforms.platform_name as platform, 
      platforms.follower_count as followers,
      'active' as status
    FROM users 
    JOIN profiles ON users.id = profiles.user_id
    JOIN platforms ON profiles.id = platforms.profile_id
    WHERE users.role = 'INFLUENCER'
  `);
  
  const influencers = result.rows;

  return influencers.map(inf => ({
    ...inf,
    followers: inf.followers > 1000000 
      ? `${(inf.followers / 1000000).toFixed(1)}M`
      : `${Math.round(inf.followers / 1000)}K`
  }));
};

export const getCampaigns = async () => {
  const result = await query(`
    SELECT 
      c.id, c.title as name, c.created_at as week, c.status,
      COALESCE(p.full_name, 'Unassigned') as assignedTo
    FROM campaigns c
    LEFT JOIN negotiations n ON c.id = n.campaign_id AND n.status = 'ACCEPTED'
    LEFT JOIN users u ON n.creator_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
  `);
  
  return result.rows;
};
