import { queryOne } from '../lib/database.js';

const getBagService = async (userId, bagId, includeLost = false) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format - if invalid, return null instead of letting database throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagId)) {
    return null; // Invalid UUID format, bag not found
  }

  // Find bag and ensure user owns it (security)
  const bagQuery = `
    SELECT 
      b.id, 
      b.user_id, 
      b.name, 
      b.description,
      b.is_public, 
      b.is_friends_visible, 
      b.created_at, 
      b.updated_at
    FROM bags b
    WHERE b.id = $1 AND b.user_id = $2
  `;

  const bag = await queryOne(bagQuery, [bagId, userId]);

  if (!bag) {
    return null;
  }

  // Get bag contents with disc master data
  const lostCondition = includeLost ? '' : 'AND bc.is_lost = false';
  const contentsQuery = `
    SELECT 
      bc.id,
      bc.user_id,
      bc.bag_id,
      bc.disc_id,
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
      bc.is_lost,
      bc.added_at,
      bc.updated_at,
      dm.id as disc_master_id,
      dm.brand as disc_master_brand,
      dm.model as disc_master_model,
      dm.speed as disc_master_speed,
      dm.glide as disc_master_glide,
      dm.turn as disc_master_turn,
      dm.fade as disc_master_fade,
      dm.approved as disc_master_approved,
      dm.added_by_id as disc_master_added_by_id,
      dm.created_at as disc_master_created_at,
      dm.updated_at as disc_master_updated_at
    FROM bag_contents bc
    JOIN disc_master dm ON bc.disc_id = dm.id
    WHERE bc.bag_id = $1 ${lostCondition}
    ORDER BY bc.added_at ASC
  `;

  const { queryRows } = await import('../lib/database.js');
  const allContents = await queryRows(contentsQuery, [bagId]);

  // Transform the flat results into the expected structure
  const transformedContents = allContents.map((content) => {
    const discMaster = {
      id: content.disc_master_id,
      brand: content.disc_master_brand,
      model: content.disc_master_model,
      speed: content.disc_master_speed,
      glide: content.disc_master_glide,
      turn: content.disc_master_turn,
      fade: content.disc_master_fade,
      approved: content.disc_master_approved,
      added_by_id: content.disc_master_added_by_id,
      created_at: content.disc_master_created_at,
      updated_at: content.disc_master_updated_at,
    };

    // Create merged content with flight numbers and disc names
    const mergedContent = {
      id: content.id,
      user_id: content.user_id,
      bag_id: content.bag_id,
      disc_id: content.disc_id,
      notes: content.notes,
      weight: content.weight ? parseFloat(content.weight).toString() : content.weight,
      condition: content.condition,
      plastic_type: content.plastic_type,
      color: content.color,
      speed: content.speed !== null ? content.speed : discMaster.speed,
      glide: content.glide !== null ? content.glide : discMaster.glide,
      turn: content.turn !== null ? content.turn : discMaster.turn,
      fade: content.fade !== null ? content.fade : discMaster.fade,
      brand: content.brand !== null ? content.brand : discMaster.brand,
      model: content.model !== null ? content.model : discMaster.model,
      is_lost: content.is_lost,
      created_at: content.added_at,
      updated_at: content.updated_at,
      disc_master: discMaster,
    };

    return mergedContent;
  });

  bag.bag_contents = transformedContents;

  return bag;
};

export default getBagService;
