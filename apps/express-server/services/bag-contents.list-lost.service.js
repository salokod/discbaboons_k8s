import { queryOne, queryRows } from '../lib/database.js';

const listLostDiscsService = async (userId, options = {}, dbClient = { queryOne, queryRows }) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Set default pagination and sorting options
  const limit = options.limit || 30;
  const offset = options.offset || 0;
  const sortField = options.sort || 'lost_at';
  const sortOrder = options.order || 'desc';

  // Validate sort field and order to prevent SQL injection
  const validSortFields = ['lost_at', 'added_at', 'updated_at', 'brand', 'model'];
  const validSortOrders = ['asc', 'desc'];

  if (!validSortFields.includes(sortField)) {
    const error = new Error('Invalid sort field');
    error.name = 'ValidationError';
    throw error;
  }

  if (!validSortOrders.includes(sortOrder.toLowerCase())) {
    const error = new Error('Invalid sort order');
    error.name = 'ValidationError';
    throw error;
  }

  // Get total count of user's lost discs
  const countQuery = `
    SELECT COUNT(*) as count
    FROM bag_contents 
    WHERE user_id = $1 AND is_lost = true
  `;
  const countResult = await dbClient.queryOne(countQuery, [userId]);
  const totalCount = parseInt(countResult.count, 10);

  // Query for user's lost discs with disc_master join
  const lostDiscsQuery = `
    SELECT 
      bc.*,
      dm.speed as dm_speed,
      dm.glide as dm_glide,
      dm.turn as dm_turn,
      dm.fade as dm_fade,
      dm.brand as dm_brand,
      dm.model as dm_model,
      dm.approved as dm_approved
    FROM bag_contents bc
    LEFT JOIN disc_master dm ON bc.disc_id = dm.id
    WHERE bc.user_id = $1 AND bc.is_lost = true
    ORDER BY bc.${sortField} ${sortOrder.toUpperCase()}
    LIMIT $2 OFFSET $3
  `;

  const lostDiscs = await dbClient.queryRows(lostDiscsQuery, [userId, limit, offset]);

  // Merge custom flight numbers and disc names with disc_master fallbacks
  const mergedLostDiscs = lostDiscs.map((content) => ({
    id: content.id,
    user_id: content.user_id,
    bag_id: content.bag_id,
    disc_id: content.disc_id,
    color: content.color,
    weight: content.weight ? parseFloat(content.weight).toString() : content.weight,
    condition: content.condition,
    is_lost: content.is_lost,
    lost_at: content.lost_at,
    lost_notes: content.lost_notes,
    created_at: content.added_at,
    updated_at: content.updated_at,
    speed: content.speed ?? content.dm_speed,
    glide: content.glide ?? content.dm_glide,
    turn: content.turn ?? content.dm_turn,
    fade: content.fade ?? content.dm_fade,
    brand: content.brand ?? content.dm_brand,
    model: content.model ?? content.dm_model,
    // Include disc_master data for compatibility
    disc_master: {
      id: content.disc_id,
      speed: content.dm_speed,
      glide: content.dm_glide,
      turn: content.dm_turn,
      fade: content.dm_fade,
      brand: content.dm_brand,
      model: content.dm_model,
      approved: content.dm_approved,
    },
  }));

  // Return results with pagination metadata
  return {
    lost_discs: mergedLostDiscs,
    pagination: {
      total: totalCount,
      limit,
      offset,
      has_more: (offset + limit) < totalCount,
    },
  };
};

export default listLostDiscsService;
