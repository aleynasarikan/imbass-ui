import { query } from '../db';
import { emitTo } from '../socket';

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
  let neg = await query(
    `SELECT id, status, creator_id, agency_id FROM negotiations WHERE campaign_id = $1 AND (creator_id = $2 OR agency_id = $2)`,
    [campaignId, userId]
  );

  let negotiationId;
  let eventType = 'COUNTER_OFFER';

  if (neg.rows.length === 0) {
    if (role !== 'AGENCY' && role !== 'PRODUCER') {
      throw { statusCode: 403, message: 'Only Agency can initiate the first offer from UI context usually, but wait, both can offer.' };
    }
    throw { statusCode: 400, message: 'Negotiation does not exist' };
  } else {
    negotiationId = neg.rows[0].id;
    if (neg.rows[0].status === 'PENDING' && role === 'AGENCY') {
      eventType = 'OFFER_MADE';
    }
  }

  const result = await query(
    `UPDATE negotiations 
     SET current_offer_cents = $1, status = 'PENDING', updated_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [offerAmount, negotiationId]
  );

  await query(
    `INSERT INTO negotiation_events (negotiation_id, actor_id, event_type, offer_amount_cents) 
     VALUES ($1, $2, $3, $4)`,
    [negotiationId, userId, eventType, offerAmount]
  );

  const updated = result.rows[0];

  // ── Sprint 3: Real-time push to the other party ──
  const otherPartyId = role === 'AGENCY' ? updated.creator_id : updated.agency_id;
  if (otherPartyId) {
    emitTo(otherPartyId, 'negotiation:update', {
      negotiationId,
      campaignId,
      event: eventType,
      offerAmountCents: offerAmount,
      updatedBy: userId,
      negotiation: updated,
    });
  }

  return updated;
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

  const updated = result.rows[0];

  // ── Sprint 3: Notify both parties ──
  const otherPartyId = userId === updated.creator_id ? updated.agency_id : updated.creator_id;
  if (otherPartyId) {
    emitTo(otherPartyId, 'negotiation:update', {
      negotiationId,
      event: 'OFFER_ACCEPTED',
      updatedBy: userId,
      negotiation: updated,
    });
  }

  return updated;
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

  const updated = result.rows[0];

  // ── Sprint 3: Notify the other party ──
  const otherPartyId = userId === updated.creator_id ? updated.agency_id : updated.creator_id;
  if (otherPartyId) {
    emitTo(otherPartyId, 'negotiation:update', {
      negotiationId,
      event: 'OFFER_REJECTED',
      updatedBy: userId,
      negotiation: updated,
    });
  }

  return updated;
};
