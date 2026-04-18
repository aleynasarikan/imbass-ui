"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCampaign = exports.createCampaign = exports.getCampaignsDashboard = exports.getCampaigns = exports.getInfluencers = void 0;
const db_1 = require("../db");
const getInfluencers = async () => {
    const result = await (0, db_1.query)(`
    SELECT 
      profiles.id, 
      profiles.full_name as name, 
      social_accounts.platform as platform, 
      social_accounts.follower_count as followers,
      'active' as status
    FROM users 
    JOIN profiles ON users.id = profiles.user_id
    JOIN social_accounts ON profiles.id = social_accounts.profile_id
    WHERE users.role = 'INFLUENCER'
  `);
    const influencers = result.rows;
    return influencers.map((inf) => ({
        ...inf,
        followers: inf.followers > 1000000
            ? `${(inf.followers / 1000000).toFixed(1)}M`
            : `${Math.round(inf.followers / 1000)}K`
    }));
};
exports.getInfluencers = getInfluencers;
const getCampaigns = async () => {
    const result = await (0, db_1.query)(`
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
exports.getCampaigns = getCampaigns;
const getCampaignsDashboard = async () => {
    const result = await (0, db_1.query)(`
    SELECT 
      c.id, 
      c.title as name, 
      c.created_at, 
      c.status,
      COALESCE(SUM(ad.conversions), 0) as redemptions
    FROM campaigns c
    LEFT JOIN applications a ON c.id = a.campaign_id
    LEFT JOIN analytics_data ad ON a.id = ad.application_id
    GROUP BY c.id, c.title, c.created_at, c.status
    ORDER BY c.created_at DESC
    LIMIT 10
  `);
    const colors = ['#e8a87c', '#d4736e', '#c97b84', '#b08bbf'];
    return result.rows.map((row, i) => {
        // Generate a basic "remaining time" text, e.g. "48h" based on a mock calculation or just fallback to 48h for now.
        // Ideally we would have an end_date in campaigns, but we don't.
        return {
            id: row.id,
            name: row.name,
            remaining: '48h',
            redemptions: parseInt(row.redemptions, 10),
            color: colors[i % colors.length]
        };
    });
};
exports.getCampaignsDashboard = getCampaignsDashboard;
const createCampaign = async (userId, title) => {
    const result = await (0, db_1.query)(`INSERT INTO campaigns (creator_id, title, status) VALUES ($1, $2, 'OPEN') RETURNING *`, [userId, title]);
    return result.rows[0];
};
exports.createCampaign = createCampaign;
const applyCampaign = async (campaignId, influencerId) => {
    // Check if already applied
    const existing = await (0, db_1.query)(`SELECT id FROM applications WHERE campaign_id = $1 AND influencer_id = $2`, [campaignId, influencerId]);
    if (existing.rows.length > 0) {
        throw { statusCode: 400, message: 'You have already applied to this campaign' };
    }
    const result = await (0, db_1.query)(`INSERT INTO applications (campaign_id, influencer_id, status) VALUES ($1, $2, 'PENDING') RETURNING *`, [campaignId, influencerId]);
    return result.rows[0];
};
exports.applyCampaign = applyCampaign;
