import { query } from '../db';

export const getNegotiations = async (userId: string, role: string) => {
  let result;
  if (role === 'INFLUENCER') {
    result = await query(`
      SELECT n.*, c.title as campaign_name, p.full_name as agency_name
      FROM negotiations n
      JOIN campaigns c ON n.campaign_id = c.id
      LEFT JOIN profiles p ON n.agency_id = p.user_id
      WHERE n.creator_id = $1
      ORDER BY n.updated_at DESC
    `, [userId]);
  } else {
    // Agency or Producer
    result = await query(`
      SELECT n.*, c.title as campaign_name, p.full_name as influencer_name
      FROM negotiations n
      JOIN campaigns c ON n.campaign_id = c.id
      LEFT JOIN profiles p ON n.creator_id = p.user_id
      WHERE n.agency_id = $1
      ORDER BY n.updated_at DESC
    `, [userId]);
  }
  return result.rows;
};

export const makeOffer = async (campaignId: string, userId: string, role: string, offerAmount: number) => {
  // Find if negotiation exists
  let neg = await query(
    `SELECT id, status FROM negotiations WHERE campaign_id = $1 AND (creator_id = $2 OR agency_id = $2)`,
    [campaignId, userId]
  );
  
  let negotiationId;
  let eventType = 'COUNTER_OFFER';

  if (neg.rows.length === 0) {
    if (role !== 'AGENCY' && role !== 'PRODUCER') {
        throw { statusCode: 403, message: 'Only Agency can initiate the first offer from UI context usually, but wait, both can offer.' };
    }
    // For simplicity, allow anyone to initiate if not exists?
    // Actually, agency makes the campaign. We need the other party's id.
    // In our simplified logic, wait, we need creator_id (influencer) and agency_id.
    // If agency is making offer, we need an influencerId in the request.
    // Let's assume this route is called on an existing negotiation placeholder, or the agency offers to a specific influencer. 
    throw { statusCode: 400, message: 'Negotiation does not exist' };
  } else {
    negotiationId = neg.rows[0].id;
    if (neg.rows[0].status === 'PENDING' && role === 'AGENCY') {
        eventType = 'OFFER_MADE';
    }
  }

  // Update negotiation
  const result = await query(
    `UPDATE negotiations 
     SET current_offer_cents = $1, status = 'PENDING', updated_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [offerAmount, negotiationId]
  );

  // Log event
  await query(
    `INSERT INTO negotiation_events (negotiation_id, actor_id, event_type, offer_amount_cents) 
     VALUES ($1, $2, $3, $4)`,
    [negotiationId, userId, eventType, offerAmount]
  );

  return result.rows[0];
};

export const acceptOffer = async (negotiationId: string, userId: string) => {
  const result = await query(
    `UPDATE negotiations SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [negotiationId]
  );

  await query(
    `INSERT INTO negotiation_events (negotiation_id, actor_id, event_type) VALUES ($1, $2, 'OFFER_ACCEPTED')`,
    [negotiationId, userId]
  );

  // In epic 3, here we should also trigger Ledger entries (Escrow transfer).
  // For the sake of the MVP, we will assume financial logic triggers here.
  
  return result.rows[0];
};

export const rejectOffer = async (negotiationId: string, userId: string) => {
  const result = await query(
    `UPDATE negotiations SET status = 'REJECTED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [negotiationId]
  );

  await query(
    `INSERT INTO negotiation_events (negotiation_id, actor_id, event_type) VALUES ($1, $2, 'OFFER_REJECTED')`,
    [negotiationId, userId]
  );

  return result.rows[0];
};
