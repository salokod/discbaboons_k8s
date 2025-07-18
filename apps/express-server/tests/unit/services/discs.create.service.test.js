/* eslint-disable camelcase, no-underscore-dangle */

import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let createDiscService;

beforeAll(async () => {
  ({ default: createDiscService } = await import('../../../services/discs.create.service.js'));
});

describe('createDiscService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.query.mockClear();
  });

  test('should export a function', () => {
    expect(typeof createDiscService).toBe('function');
  });

  test('should throw ValidationError if required fields are missing', async () => {
    const brand = chance.word();
    const model = chance.word();
    const speed = chance.integer({ min: 1, max: 14 });
    const glide = chance.integer({ min: 1, max: 7 });
    const turn = chance.integer({ min: -5, max: 2 });

    await expect(createDiscService({})).rejects.toThrow('Brand is required');
    await expect(createDiscService({ brand })).rejects.toThrow('Model is required');
    await expect(createDiscService({ brand, model })).rejects.toThrow('Speed is required');
    await expect(createDiscService({ brand, model, speed })).rejects.toThrow('Glide is required');
    await expect(createDiscService({
      brand, model, speed, glide,
    })).rejects.toThrow('Turn is required');
    await expect(createDiscService({
      brand, model, speed, glide, turn,
    })).rejects.toThrow('Fade is required');
  });

  test('should create a disc with pending approval and return the created disc', async () => {
    const brand = chance.word();
    const model = chance.word();
    const speed = chance.integer({ min: 1, max: 14 });
    const glide = chance.integer({ min: 1, max: 7 });
    const turn = chance.integer({ min: -5, max: 2 });
    const fade = chance.integer({ min: 0, max: 5 });
    const added_by_id = chance.integer({ min: 1, max: 100 });

    const fakeDisc = {
      id: chance.guid(),
      brand,
      model,
      speed,
      glide,
      turn,
      fade,
      approved: false,
      added_by_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock no existing disc and successful creation
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing disc
      .mockResolvedValueOnce(fakeDisc); // Created disc

    const result = await createDiscService({
      brand, model, speed, glide, turn, fade, added_by_id,
    });

    expect(result).toBe(fakeDisc);
  });

  test('should throw ValidationError if disc with same brand and model exists (case-insensitive)', async () => {
    const brand = chance.word();
    const model = chance.word();
    const discData = {
      brand,
      model,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      added_by_id: chance.integer({ min: 1, max: 100 }),
    };

    // Simulate existing disc found
    mockDatabase.queryOne.mockResolvedValue({ id: chance.guid(), ...discData });

    await expect(createDiscService(discData)).rejects.toThrow('A disc with this brand and model already exists');
  });
});
