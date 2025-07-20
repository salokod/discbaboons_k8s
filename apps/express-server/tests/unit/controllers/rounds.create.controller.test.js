import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import roundsCreateController from '../../../controllers/rounds.create.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.create.service.js', () => ({
  default: vi.fn(),
}));

describe('roundsCreateController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let roundsCreateService;

  beforeEach(async () => {
    // Import the mocked service
    const module = await import('../../../services/rounds.create.service.js');
    roundsCreateService = module.default;

    mockReq = {
      user: { userId: chance.integer({ min: 1 }) },
      body: {
        courseId: chance.word(),
        name: chance.sentence({ words: 3 }),
        startingHole: chance.integer({ min: 1, max: 18 }),
        isPrivate: chance.bool(),
        skinsEnabled: chance.bool(),
        skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();

    roundsCreateService.mockClear();
  });

  test('should export a function', () => {
    expect(typeof roundsCreateController).toBe('function');
  });

  test('should call service with roundData and userId', async () => {
    const expectedRound = { id: chance.guid({ version: 4 }) };
    roundsCreateService.mockResolvedValueOnce(expectedRound);

    await roundsCreateController(mockReq, mockRes, mockNext);

    expect(roundsCreateService).toHaveBeenCalledWith(mockReq.body, mockReq.user.userId);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expectedRound);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const serviceError = new Error('Service error');
    roundsCreateService.mockRejectedValueOnce(serviceError);

    await roundsCreateController(mockReq, mockRes, mockNext);

    expect(roundsCreateService).toHaveBeenCalledWith(mockReq.body, mockReq.user.userId);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(serviceError);
  });
});
