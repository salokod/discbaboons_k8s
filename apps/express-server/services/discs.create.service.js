/* eslint-disable camelcase, no-underscore-dangle */
import { queryOne } from '../lib/database.js';

const createDiscService = async (discData = {}, dbClient = { queryOne }) => {
  const {
    brand, model, speed, glide, turn, fade, added_by_id,
  } = discData;

  if (!brand) {
    const error = new Error('Brand is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!model) {
    const error = new Error('Model is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof speed === 'undefined') {
    const error = new Error('Speed is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof glide === 'undefined') {
    const error = new Error('Glide is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof turn === 'undefined') {
    const error = new Error('Turn is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (typeof fade === 'undefined') {
    const error = new Error('Fade is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check for duplicate (case-insensitive)
  const existing = await dbClient.queryOne(
    `SELECT id, brand, model 
     FROM disc_master 
     WHERE LOWER(brand) = LOWER($1) AND LOWER(model) = LOWER($2)`,
    [brand, model],
  );

  if (existing) {
    const error = new Error('A disc with this brand and model already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // Always create as pending approval
  return dbClient.queryOne(
    `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [brand, model, speed, glide, turn, fade, false, added_by_id, new Date(), new Date()],
  );
};

export default createDiscService;
