import { queryOne, queryRows } from '../lib/database.js';

const getFriendBagService = async (userId, friendUserId, bagId) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!friendUserId) {
    const error = new Error('friendUserId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagId)) {
    const error = new Error('Invalid bagId format');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify friendship exists and is accepted (bidirectional)
  const friendship = await queryOne(
    `SELECT id FROM friendship_requests 
     WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)) 
     AND status = 'accepted'`,
    [userId, friendUserId],
  );

  if (!friendship) {
    const error = new Error('You are not friends with this user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get the specific bag if it's visible to friends or public
  const bag = await queryOne(
    `SELECT * FROM bags 
     WHERE id = $1 AND user_id = $2 AND (is_public = true OR is_friends_visible = true)`,
    [bagId, friendUserId],
  );

  if (!bag) {
    const error = new Error('Bag not found or not visible');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get bag contents with disc master data
  const contents = await queryRows(
    `SELECT 
      bc.id,
      bc.notes,
      bc.weight,
      bc.condition,
      bc.plastic_type,
      bc.color,
      bc.speed,
      bc.glide,
      bc.turn,
      bc.fade,
      bc.brand,
      bc.model,
      bc.added_at,
      bc.updated_at,
      dm.id as disc_master_id,
      dm.speed as disc_master_speed,
      dm.glide as disc_master_glide,
      dm.turn as disc_master_turn,
      dm.fade as disc_master_fade,
      dm.brand as disc_master_brand,
      dm.model as disc_master_model
     FROM bag_contents bc
     LEFT JOIN disc_master dm ON bc.disc_id = dm.id
     WHERE bc.bag_id = $1 AND bc.is_lost = false`,
    [bagId],
  );

  // Transform bag contents to include personal data with fallbacks
  const transformedContents = contents.map((content) => ({
    id: content.id,
    disc: {
      id: content.disc_master_id,
      speed: content.disc_master_speed,
      glide: content.disc_master_glide,
      turn: content.disc_master_turn,
      fade: content.disc_master_fade,
      brand: content.disc_master_brand,
      model: content.disc_master_model,
    },
    notes: content.notes,
    weight: content.weight ? parseFloat(content.weight).toString() : content.weight,
    condition: content.condition,
    plastic_type: content.plastic_type,
    color: content.color,
    speed: content.speed || content.disc_master_speed,
    glide: content.glide || content.disc_master_glide,
    turn: content.turn || content.disc_master_turn,
    fade: content.fade || content.disc_master_fade,
    brand: content.brand || content.disc_master_brand,
    model: content.model || content.disc_master_model,
    added_at: content.added_at,
    updated_at: content.updated_at,
  }));

  return {
    friend: { id: friendUserId },
    bag: {
      ...bag,
      contents: transformedContents,
    },
  };
};

export default getFriendBagService;
