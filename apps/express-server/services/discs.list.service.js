import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const listDiscsService = async (filters = {}) => {
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

  const where = {};
  if (brand) where.brand = brand;
  if (model) where.model = { contains: model, mode: 'insensitive' };
  if (speed) where.speed = parseRange(speed);
  if (glide) where.glide = parseRange(glide);
  if (turn) where.turn = parseRange(turn);
  if (fade) where.fade = parseRange(fade);

  if (typeof approved !== 'undefined') {
    if (approved === 'false' || approved === false) {
      where.approved = false;
    } else {
      where.approved = true;
    }
  } else {
    where.approved = true;
  }

  return prisma.disc_master.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  });
};

export default listDiscsService;
