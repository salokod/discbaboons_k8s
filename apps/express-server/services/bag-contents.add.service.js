import { queryOne } from '../lib/database.js';

const addToBagService = async (userId, bagId, discData) => {
  if (!userId) {
    const error = new Error('user_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bag_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!discData.disc_id) {
    const error = new Error('disc_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate bag ownership (security-first approach)
  const bagQuery = `
    SELECT id, user_id, name, is_public, is_friends_visible, created_at, updated_at
    FROM bags
    WHERE id = $1 AND user_id = $2
  `;

  const bag = await queryOne(bagQuery, [bagId, userId]);

  if (!bag) {
    const error = new Error('Bag not found or access denied');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate disc exists
  const discQuery = `
    SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at
    FROM disc_master
    WHERE id = $1
  `;

  const disc = await queryOne(discQuery, [discData.disc_id]);

  if (!disc) {
    const error = new Error('Disc not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Validate disc approval status and ownership for pending discs
  if (!disc.approved && disc.added_by_id !== userId) {
    const error = new Error('Cannot add pending disc created by another user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate flight numbers if provided
  if (discData.speed !== undefined && discData.speed !== null) {
    if (discData.speed < 1 || discData.speed > 15) {
      const error = new Error('speed must be between 1 and 15');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.glide !== undefined && discData.glide !== null) {
    if (discData.glide < 1 || discData.glide > 7) {
      const error = new Error('glide must be between 1 and 7');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.turn !== undefined && discData.turn !== null) {
    if (discData.turn < -5 || discData.turn > 2) {
      const error = new Error('turn must be between -5 and 2');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.fade !== undefined && discData.fade !== null) {
    if (discData.fade < 0 || discData.fade > 5) {
      const error = new Error('fade must be between 0 and 5');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Validate custom brand/model if provided
  if (discData.brand !== undefined && discData.brand !== null) {
    if (typeof discData.brand !== 'string' || discData.brand.length > 50) {
      const error = new Error('brand must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.model !== undefined && discData.model !== null) {
    if (typeof discData.model !== 'string' || discData.model.length > 50) {
      const error = new Error('model must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Create bag content
  const insertQuery = `
    INSERT INTO bag_contents (
      user_id, bag_id, disc_id, notes, weight, condition, plastic_type, color,
      speed, glide, turn, fade, brand, model, is_lost, added_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING *
  `;

  const bagContent = await queryOne(insertQuery, [
    userId,
    bagId,
    discData.disc_id,
    discData.notes || null,
    discData.weight || null,
    discData.condition || null,
    discData.plastic_type || null,
    discData.color || null,
    discData.speed ?? disc.speed,
    discData.glide ?? disc.glide,
    discData.turn ?? disc.turn,
    discData.fade ?? disc.fade,
    discData.brand ?? disc.brand,
    discData.model ?? disc.model,
    false, // is_lost
  ]);

  // Format weight for consistency
  if (bagContent.weight) {
    bagContent.weight = parseFloat(bagContent.weight).toString();
  }

  return bagContent;
};

export default addToBagService;
