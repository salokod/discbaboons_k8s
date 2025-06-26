import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import discsCreateController from '../../../controllers/discs.create.controller.js';

const chance = new Chance();

vi.mock('../../../services/discs.create.service.js', () => ({
  default: vi.fn(),
}));

const { default: createDiscService } = await import('../../../services/discs.create.service.js');

describe('discsCreateController', () => {
  test('should export a function', () => {
    expect(typeof discsCreateController).toBe('function');
  });

  test('should call createDiscService with req.body and user id, return 201 and result', async () => {
    const req = {
      body: {
        brand: chance.word(),
        model: chance.word(),
        speed: chance.integer({ min: 1, max: 14 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
      },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    const res = { status: vi.fn(() => res), json: vi.fn() };
    const next = vi.fn();
    const fakeResult = {
      id: chance.guid(),
      ...req.body,
      approved: false,
      added_by_id: req.user.userId,
    };
    createDiscService.mockResolvedValue(fakeResult);

    await discsCreateController(req, res, next);

    expect(createDiscService).toHaveBeenCalledWith({ ...req.body, added_by_id: req.user.userId });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    const req = {
      body: {
        brand: chance.word(),
        model: chance.word(),
        speed: chance.integer({ min: 1, max: 14 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
      },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    const res = { status: vi.fn(() => res), json: vi.fn() };
    const next = vi.fn();
    const error = new Error('fail');
    createDiscService.mockRejectedValue(error);

    await discsCreateController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
