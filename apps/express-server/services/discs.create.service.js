/* eslint-disable camelcase, no-underscore-dangle */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createDiscService = async (discData = {}) => {
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
  const existing = await prisma.disc_master.findFirst({
    where: {
      brand: { equals: brand, mode: 'insensitive' },
      model: { equals: model, mode: 'insensitive' },
    },
  });
  if (existing) {
    const error = new Error('A disc with this brand and model already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // Always create as pending approval
  return prisma.disc_master.create({
    data: {
      brand,
      model,
      speed,
      glide,
      turn,
      fade,
      approved: false,
      added_by_id,
    },
  });
};

export default createDiscService;
