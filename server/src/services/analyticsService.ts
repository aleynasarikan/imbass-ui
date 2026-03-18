import { query } from '../db';

export const getWeeklyAnalytics = async () => {
  // Aggregating Influencer Performance
  const influencerQuery = `
    SELECT 
      profiles.full_name as name,
      SUM(analytics_data.reach) as total_reach,
      SUM(analytics_data.engagement) as total_engagement
    FROM analytics_data
    JOIN applications ON analytics_data.application_id = applications.id
    JOIN users ON applications.influencer_id = users.id
    JOIN profiles ON users.id = profiles.user_id
    GROUP BY profiles.id, profiles.full_name
    ORDER BY total_engagement DESC
    LIMIT 5
  `;

  const influencerResult = await query(influencerQuery);
  const influencerPerformancesRaw = influencerResult.rows;

  const influencerPerformances = influencerPerformancesRaw.map(inf => ({
    name: inf.name,
    reach: Math.round(Number(inf.total_reach) / 1000),
    engagement: Math.round(Number(inf.total_engagement) / 1000)
  }));

  // Aggregating Ad Campaign Performance
  const adQuery = `
    SELECT 
      campaigns.title as name,
      SUM(analytics_data.clicks) as clicks,
      SUM(analytics_data.conversions) as conversions
    FROM analytics_data
    JOIN applications ON analytics_data.application_id = applications.id
    JOIN campaigns ON applications.campaign_id = campaigns.id
    GROUP BY campaigns.id, campaigns.title
    ORDER BY conversions DESC
    LIMIT 4
  `;

  const adResult = await query(adQuery);
  const adPerformances = adResult.rows;

  return {
    influencers: influencerPerformances,
    ads: adPerformances
  };
};
