import { query } from '../db';
import { AgencyRelationStatus, TaskStatus } from '../types/agency';

export const inviteCreator = async (agencyId: string, creatorId: string) => {
  const result = await query(
    `INSERT INTO agency_creators (agency_id, creator_id, status) 
     VALUES ($1, $2, 'INVITED') 
     ON CONFLICT (agency_id, creator_id) DO UPDATE SET status = 'INVITED', invited_at = NOW()
     RETURNING *`,
    [agencyId, creatorId]
  );
  return result.rows[0];
};

export const respondToInvitation = async (agencyId: string, creatorId: string, accept: boolean) => {
  const status: AgencyRelationStatus = accept ? 'ACCEPTED' : 'REJECTED';
  
  const result = await query(
    `UPDATE agency_creators 
     SET status = $3, joined_at = CASE WHEN $4 = true THEN NOW() ELSE NULL END
     WHERE agency_id = $1 AND creator_id = $2
     RETURNING *`,
    [agencyId, creatorId, status, accept]
  );
  return result.rows[0];
};

export const getRoster = async (agencyId: string) => {
  const result = await query(
    `SELECT 
      ac.*, 
      p.full_name, p.avatar_url, p.niche, p.trust_score, p.xp,
      COALESCE(SUM(ad.conversions), 0) as total_conversions,
      COALESCE(SUM(ad.reach), 0) as total_reach
     FROM agency_creators ac
     JOIN profiles p ON ac.creator_id = p.user_id
     LEFT JOIN campaigns c ON c.creator_id = ac.creator_id
     LEFT JOIN negotiations n ON n.campaign_id = c.id AND n.status = 'ACCEPTED' AND n.agency_id = ac.agency_id
     LEFT JOIN analytics_data ad ON n.id = ad.application_id
     WHERE ac.agency_id = $1 AND ac.status = 'ACCEPTED'
     GROUP BY ac.agency_id, ac.creator_id, p.id
    `,
    [agencyId]
  );
  return result.rows;
};

export const addNote = async (agencyId: string, creatorId: string, authorId: string, body: string, isPinned: boolean = false) => {
  const result = await query(
    `INSERT INTO agency_notes (agency_id, creator_id, author_id, body, is_pinned)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [agencyId, creatorId, authorId, body, isPinned]
  );
  return result.rows[0];
};

export const getNotes = async (agencyId: string, creatorId: string) => {
  const result = await query(
    `SELECT n.*, p.full_name as author_name
     FROM agency_notes n
     LEFT JOIN profiles p ON n.author_id = p.user_id
     WHERE n.agency_id = $1 AND n.creator_id = $2
     ORDER BY n.is_pinned DESC, n.created_at DESC`,
    [agencyId, creatorId]
  );
  return result.rows;
};

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
      data.creatorId || null, 
      data.campaignId || null, 
      data.assigneeId || null, 
      data.title, 
      data.description || null, 
      data.dueAt || null
    ]
  );
  return result.rows[0];
};

export const updateTaskStatus = async (taskId: string, agencyId: string, status: TaskStatus) => {
  const result = await query(
    `UPDATE tasks SET status = $1 WHERE id = $2 AND agency_id = $3 RETURNING *`,
    [status, taskId, agencyId]
  );
  return result.rows[0];
};

export const getTasks = async (agencyId: string, filters: { creatorId?: string, campaignId?: string } = {}) => {
  let q = `SELECT * FROM tasks WHERE agency_id = $1`;
  const params: any[] = [agencyId];
  
  if (filters.creatorId) {
    params.push(filters.creatorId);
    q += ` AND creator_id = $${params.length}`;
  }
  if (filters.campaignId) {
    params.push(filters.campaignId);
    q += ` AND campaign_id = $${params.length}`;
  }
  
  q += ` ORDER BY due_at ASC NULLS LAST, created_at DESC`;
  
  const result = await query(q, params);
  return result.rows;
};
