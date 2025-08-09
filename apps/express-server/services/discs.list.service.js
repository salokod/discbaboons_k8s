import { queryRows, queryOne } from '../lib/database.js';

const listDiscsService = async (filters = {}, dbClient = { queryRows, queryOne }) => {
  let { brand, model } = filters;
  const {
    speed, glide, turn, fade, approved, limit = '50', offset = '0',
  } = filters;

  // Updated regex to handle comma-separated ranges for multi-select
  const numRangeRegex = /^-?\d+(-?-?\d+)?$/;
  const multiRangeRegex = /^(-?\d+(-?-?\d+)?,?\s*)+$/;

  // Validate flight number filters (allow single range or comma-separated ranges)
  const validateFlightFilter = (value, fieldName) => {
    if (value && !numRangeRegex.test(value) && !multiRangeRegex.test(value)) {
      const error = new Error(`Invalid ${fieldName} filter value`);
      error.name = 'ValidationError';
      throw error;
    }
  };

  validateFlightFilter(speed, 'speed');
  validateFlightFilter(glide, 'glide');
  validateFlightFilter(turn, 'turn');
  validateFlightFilter(fade, 'fade');
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

  // Helper to parse range or single value, now supports comma-separated ranges
  function parseRange(val) {
    if (!val) return undefined;

    // Handle comma-separated ranges for multi-select
    if (val.includes(',')) {
      const ranges = val.split(',').map((r) => r.trim()).filter((r) => r.length > 0);
      const conditions = [];

      ranges.forEach((range) => {
        if (/^-?\d+$/.test(range)) {
          // Single number
          conditions.push({ type: 'exact', value: Number(range) });
        } else {
          const match = range.match(/^(-?\d+)-(-?\d+)$/);
          if (match) {
            const min = Number(match[1]);
            const max = Number(match[2]);
            conditions.push({ type: 'range', gte: min, lte: max });
          }
        }
      });

      return conditions.length > 0 ? { type: 'multi', conditions } : undefined;
    }

    // Single range or value (existing logic)
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

  // Brand filter (supports multiple brands with OR logic)
  if (brand) {
    // Brand mapping for common short names to full database names
    const brandMapping = {
      'Axiom': 'Axiom Discs',
      // Add more mappings here as needed
    };
    
    // Function to map brand names
    const mapBrandName = (brandName) => brandMapping[brandName] || brandName;
    
    // Handle comma-separated brands for OR logic
    if (brand.includes(',')) {
      const brands = brand.split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
        .map(mapBrandName); // Apply brand mapping
      if (brands.length > 0) {
        const brandPlaceholders = brands.map(() => {
          const placeholder = `$${paramIndex}`;
          paramIndex += 1;
          return placeholder;
        }).join(', ');
        whereConditions.push(`brand IN (${brandPlaceholders})`);
        params.push(...brands);
      }
    } else {
      // Single brand exact match with mapping
      const mappedBrand = mapBrandName(brand);
      whereConditions.push(`brand = $${paramIndex}`);
      params.push(mappedBrand);
      paramIndex += 1;
    }
  }

  // Model filter (case-insensitive partial match)
  if (model) {
    whereConditions.push(`model ILIKE $${paramIndex}`);
    params.push(`%${model}%`);
    paramIndex += 1;
  }

  // Helper function to build flight number filter conditions
  function buildFlightFilter(fieldName, filterValue) {
    if (!filterValue) return;

    const range = parseRange(filterValue);
    if (typeof range === 'number') {
      whereConditions.push(`${fieldName} = $${paramIndex}`);
      params.push(range);
      paramIndex += 1;
    } else if (range && range.gte !== undefined && range.lte !== undefined) {
      whereConditions.push(`${fieldName} >= $${paramIndex} AND ${fieldName} <= $${paramIndex + 1}`);
      params.push(range.gte, range.lte);
      paramIndex += 2;
    } else if (range && range.type === 'multi') {
      // Handle multiple ranges with OR logic
      const orConditions = [];
      range.conditions.forEach((condition) => {
        if (condition.type === 'exact') {
          orConditions.push(`${fieldName} = $${paramIndex}`);
          params.push(condition.value);
          paramIndex += 1;
        } else if (condition.type === 'range') {
          orConditions.push(`(${fieldName} >= $${paramIndex} AND ${fieldName} <= $${paramIndex + 1})`);
          params.push(condition.gte, condition.lte);
          paramIndex += 2;
        }
      });
      if (orConditions.length > 0) {
        whereConditions.push(`(${orConditions.join(' OR ')})`);
      }
    }
  }

  // Apply flight number filters
  buildFlightFilter('speed', speed);
  buildFlightFilter('glide', glide);
  buildFlightFilter('turn', turn);
  buildFlightFilter('fade', fade);

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
