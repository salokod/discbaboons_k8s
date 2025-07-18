import { queryOne } from '../lib/database.js';

const approveDiscService = async (discId, dbClient = { queryOne }) => {
  const disc = await dbClient.queryOne(
    `SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at
     FROM disc_master 
     WHERE id = $1`,
    [discId],
  );

  if (!disc) {
    const error = new Error('Disc not found');
    error.name = 'NotFoundError';
    error.status = 404;
    throw error;
  }

  return dbClient.queryOne(
    `UPDATE disc_master 
     SET approved = $1, updated_at = $2 
     WHERE id = $3 
     RETURNING *`,
    [true, new Date(), discId],
  );
};

export default approveDiscService;
