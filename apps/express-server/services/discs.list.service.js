import { queryRows, queryOne } from '../lib/database.js';

const listDiscsService = async (filters = {}, dbClient = { queryRows, queryOne }) => {
  let { brand, model } = filters;
  const {
    speed, glide, turn, fade, approved, limit = '50', offset = '0',
  } = filters;

  const numRangeRegex = /^-?\d+(-?-?\d+)?$/;

  if (speed && !numRangeRegex.test(speed)) {
    const error = new Error('Invalid filter value');
    error.name = 'ValidationError';
    throw error;
  }
  if (glide && !numRangeRegex.test(glide)) {
    const error = new Error('Invalid filter value');
    error.name = 'ValidationError';
    throw error;
  }
  if (turn && !numRangeRegex.test(turn)) {
    const error = new Error('Invalid filter value');
    error.name = 'ValidationError';
    throw error;
  }
  if (fade && !numRangeRegex.test(fade)) {
    const error = new Error('Invalid filter value');
    error.name = 'ValidationError';
    throw error;
  }
  if (limit && (Number.isNaN(Number(limit)) || Number(limit) < 0)) {
    const error = new Error('Invalid limit');
    error.name = 'ValidationError';
    throw error;
  }
  if (offset && (Number.isNaN(Number(offset)) || Number(offset) < 0)) {
    const error = new Error('Invalid offset');
    error.name = 'ValidationError';
    throw error;
  }

  // Trim whitespace from string filters
  if (typeof brand === 'string') brand = brand.trim();
  if (typeof model === 'string') model = model.trim();

  // Helper to parse range or single value
  function parseRange(val) {
    if (!val) return undefined;
    if (/^-?\d+$/.test(val)) {
      return Number(val);
    }
    const match = val.match(/^(-?\d+)-(-?\d+)$/);
    if (match) {
      const min = Number(match[1]);
      const max = Number(match[2]);
      return { gte: min, lte: max };
    }
    return undefined;
  }

  // Build WHERE conditions and parameters
  const whereConditions = [];
  const params = [];
  let paramIndex = 1;

  // Brand filter (exact match)
  if (brand) {
    whereConditions.push(`brand = $${paramIndex}`);
    params.push(brand);
    paramIndex += 1;
  }

  // Model filter (case-insensitive partial match)
  if (model) {
    whereConditions.push(`model ILIKE $${paramIndex}`);
    params.push(`%${model}%`);
    paramIndex += 1;
  }

  // Speed filter (single value or range)
  if (speed) {
    const speedRange = parseRange(speed);
    if (typeof speedRange === 'number') {
      whereConditions.push(`speed = $${paramIndex}`);
      params.push(speedRange);
      paramIndex += 1;
    } else if (speedRange && speedRange.gte !== undefined && speedRange.lte !== undefined) {
      whereConditions.push(`speed >= $${paramIndex} AND speed <= $${paramIndex + 1}`);
      params.push(speedRange.gte, speedRange.lte);
      paramIndex += 2;
    }
  }

  // Glide filter (single value or range)
  if (glide) {
    const glideRange = parseRange(glide);
    if (typeof glideRange === 'number') {
      whereConditions.push(`glide = $${paramIndex}`);
      params.push(glideRange);
      paramIndex += 1;
    } else if (glideRange && glideRange.gte !== undefined && glideRange.lte !== undefined) {
      whereConditions.push(`glide >= $${paramIndex} AND glide <= $${paramIndex + 1}`);
      params.push(glideRange.gte, glideRange.lte);
      paramIndex += 2;
    }
  }

  // Turn filter (single value or range)
  if (turn) {
    const turnRange = parseRange(turn);
    if (typeof turnRange === 'number') {
      whereConditions.push(`turn = $${paramIndex}`);
      params.push(turnRange);
      paramIndex += 1;
    } else if (turnRange && turnRange.gte !== undefined && turnRange.lte !== undefined) {
      whereConditions.push(`turn >= $${paramIndex} AND turn <= $${paramIndex + 1}`);
      params.push(turnRange.gte, turnRange.lte);
      paramIndex += 2;
    }
  }

  // Fade filter (single value or range)
  if (fade) {
    const fadeRange = parseRange(fade);
    if (typeof fadeRange === 'number') {
      whereConditions.push(`fade = $${paramIndex}`);
      params.push(fadeRange);
      paramIndex += 1;
    } else if (fadeRange && fadeRange.gte !== undefined && fadeRange.lte !== undefined) {
      whereConditions.push(`fade >= $${paramIndex} AND fade <= $${paramIndex + 1}`);
      params.push(fadeRange.gte, fadeRange.lte);
      paramIndex += 2;
    }
  }

  // Approved filter
  if (typeof approved !== 'undefined') {
    if (approved === 'false' || approved === false) {
      whereConditions.push(`approved = $${paramIndex}`);
      params.push(false);
      paramIndex += 1;
    } else {
      whereConditions.push(`approved = $${paramIndex}`);
      params.push(true);
      paramIndex += 1;
    }
  } else {
    whereConditions.push(`approved = $${paramIndex}`);
    params.push(true);
    paramIndex += 1;
  }

  // Build the complete query
  let query = 'SELECT * FROM disc_master';

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // Cap limit at 100 and ensure minimum of 1
  const parsedLimit = Math.min(Math.max(Number.isNaN(Number(limit)) ? 50 : Number(limit), 1), 100);
  const parsedOffset = Math.max(Number.isNaN(Number(offset)) ? 0 : Number(offset), 0);

  query += ' ORDER BY brand ASC, model ASC';
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  params.push(parsedLimit, parsedOffset);

  // Get total count with same filters
  let countQuery = 'SELECT COUNT(*) as count FROM disc_master';
  if (whereConditions.length > 0) {
    countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  const countParams = params.slice(0, -2); // Remove limit and offset for count query

  // Execute both queries
  const [discs, countResult] = await Promise.all([
    dbClient.queryRows(query, params),
    dbClient.queryOne(countQuery, countParams),
  ]);

  const total = parseInt(countResult.count, 10);
  const hasMore = parsedOffset + parsedLimit < total;

  return {
    discs,
    total,
    limit: parsedLimit,
    offset: parsedOffset,
    hasMore,
  };
};

export default listDiscsService;
