import { transaction } from '../lib/database.js';

const moveDiscService = async (
  userId,
  sourceBagId,
  targetBagId,
  options = {},
) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!sourceBagId) {
    const error = new Error('sourceBagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!targetBagId) {
    const error = new Error('targetBagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format for both bag IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sourceBagId) || !uuidRegex.test(targetBagId)) {
    return null; // Invalid UUID format, bags not found
  }

  return transaction(async (client) => {
    // Validate both bags exist and belong to user
    const sourceBag = await client.query(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );

    if (sourceBag.rows.length === 0) {
      const error = new Error('Source bag not found or access denied');
      error.name = 'NotFoundError';
      throw error;
    }

    const targetBag = await client.query(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [targetBagId, userId],
    );

    if (targetBag.rows.length === 0) {
      const error = new Error('Target bag not found or access denied');
      error.name = 'NotFoundError';
      throw error;
    }

    // Determine which discs to move
    let discsToMove;
    if (options.contentIds && options.contentIds.length > 0) {
      // Move specific discs by ID
      const placeholders = options.contentIds.map((_, index) => `$${index + 2}`).join(', ');
      discsToMove = await client.query(
        `SELECT id FROM bag_contents WHERE id IN (${placeholders}) AND bag_id = $1`,
        [sourceBagId, ...options.contentIds],
      );
    } else {
      // Move all discs from source bag
      discsToMove = await client.query(
        'SELECT id FROM bag_contents WHERE bag_id = $1',
        [sourceBagId],
      );
    }

    if (discsToMove.rows.length === 0) {
      return { message: 'No discs found to move', movedCount: 0 };
    }

    // Update discs to target bag with new timestamp
    const discIds = discsToMove.rows.map((disc) => disc.id);
    const placeholders = discIds.map((_, index) => `$${index + 3}`).join(', ');
    const updateResult = await client.query(
      `UPDATE bag_contents SET bag_id = $1, updated_at = $2 WHERE id IN (${placeholders})`,
      [targetBagId, new Date(), ...discIds],
    );

    return {
      message: 'Discs moved successfully',
      movedCount: updateResult.rowCount,
    };
  });
};

export default moveDiscService;
