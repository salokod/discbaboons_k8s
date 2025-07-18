import { queryOne } from '../lib/database.js';

const ALLOWED_FIELDS = [
  'name',
  'bio',
  'country',
  'state_province',
  'city',
  'isnamepublic',
  'isbiopublic',
  'islocationpublic',
];

const updateProfileService = async (userId, updateData) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
    const error = new Error('Update data is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Filter updateData to only allowed fields
  const filteredData = Object.fromEntries(
    Object.entries(updateData).filter(([key]) => ALLOWED_FIELDS.includes(key)),
  );

  if (Object.keys(filteredData).length === 0) {
    const error = new Error('No valid fields to update');
    error.name = 'ValidationError';
    throw error;
  }

  // Implement upsert logic with raw SQL
  const fields = Object.keys(filteredData);
  const values = Object.values(filteredData);

  // Create placeholders for insert values
  const insertPlaceholders = fields.map((_, index) => `$${index + 2}`).join(', ');
  const insertFields = fields.join(', ');

  // Create SET clause for update
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

  const profile = await queryOne(
    `INSERT INTO user_profiles (user_id, ${insertFields}) VALUES ($1, ${insertPlaceholders})
     ON CONFLICT (user_id) DO UPDATE SET ${setClause}
     RETURNING *`,
    [userId, ...values],
  );

  return {
    success: true,
    profile,
  };
};

export default updateProfileService;
