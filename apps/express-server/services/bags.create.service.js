/* eslint-disable camelcase */
import { queryOne } from '../lib/database.js';

const createBagService = async (userId, bagData = {}) => {
  const {
    name,
    description,
    is_public = false,
    is_friends_visible = false,
  } = bagData;

  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!name) {
    const error = new Error('Bag name is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (name.length > 100) {
    const error = new Error('Bag name must be 100 characters or less');
    error.name = 'ValidationError';
    throw error;
  }
  if (description && description.length > 500) {
    const error = new Error('Description must be 500 characters or less');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof is_public !== 'boolean') {
    const error = new Error('is_public must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof is_friends_visible !== 'boolean') {
    const error = new Error('is_friends_visible must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }

  // Check for duplicate bag name (case-insensitive)
  const existing = await queryOne(
    'SELECT id FROM bags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
    [userId, name],
  );
  if (existing) {
    const error = new Error('Bag with this name already exists for this user');
    error.name = 'ValidationError';
    throw error;
  }

  // Create the bag
  return queryOne(
    'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, name, description, is_public, is_friends_visible],
  );
};

export default createBagService;
