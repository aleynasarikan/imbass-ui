import { query } from '../db';

export const logAction = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  changes: any = null,
  ipAddress: string | null = null
) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, changes ? JSON.stringify(changes) : null, ipAddress]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
