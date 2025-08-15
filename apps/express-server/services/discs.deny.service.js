// apps/express-server/services/discs.deny.service.js
// Service for denying disc submissions
import { queryOne } from '../lib/database.js';

export default async function denyDiscService(
  discId,
  denialReason,
  denyingUserId,
  dbClient = { queryOne },
) {
  // Validate disc exists
  const discQuery = `
    SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at
    FROM disc_master
    WHERE id = $1
  `;

  const disc = await dbClient.queryOne(discQuery, [discId]);

  if (!disc) {
    const error = new Error('Disc not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Validate denial reason
  if (!denialReason || denialReason.trim() === '') {
    const error = new Error('Denial reason is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Deny the disc
  return dbClient.queryOne(
    `UPDATE disc_master 
     SET denied = $1, denied_reason = $2, denied_at = $3, denied_by_id = $4 
     WHERE id = $5 
     RETURNING *`,
    [true, denialReason, new Date(), denyingUserId, discId],
  );
}
