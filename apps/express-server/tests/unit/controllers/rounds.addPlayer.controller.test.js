import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import addPlayerController from '../../../controllers/rounds.addPlayer.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.addPlayer.service.js', () => ({
  addPlayerToRound: vi.fn(),
}));

describe('rounds.addPlayer.controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let addPlayerToRound;

  beforeEach(async () => {
    // Import the mocked service
    const module = await import('../../../services/rounds.addPlayer.service.js');
    addPlayerToRound = module.addPlayerToRound;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();

    addPlayerToRound.mockClear();
  });

  test('should export a function', () => {
    expect(typeof addPlayerController).toBe('function');
  });

  test('should return 400 if roundId is missing', async () => {
    mockReq = {
      params: {}, // No roundId
      body: { userId: chance.integer({ min: 1, max: 1000 }) },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };

    await addPlayerController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Round ID is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should successfully add a user player and return 201', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestingUserId = chance.integer({ min: 1001, max: 2000 });
    const insertedPlayer = {
      id: chance.guid(),
      round_id: roundId,
      user_id: userId,
      is_guest: false,
      joined_at: new Date(),
    };

    addPlayerToRound.mockResolvedValue(insertedPlayer);

    mockReq = {
      params: { id: roundId },
      body: { userId },
      user: { userId: requestingUserId },
    };

    await addPlayerController(mockReq, mockRes, mockNext);

    expect(addPlayerToRound).toHaveBeenCalledWith(
      roundId,
      { userId },
      requestingUserId,
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(insertedPlayer);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should successfully add a guest player and return 201', async () => {
    const roundId = chance.guid();
    const guestName = chance.name();
    const requestingUserId = chance.integer({ min: 1001, max: 2000 });
    const insertedPlayer = {
      id: chance.guid(),
      round_id: roundId,
      user_id: null,
      guest_name: guestName,
      is_guest: true,
      joined_at: new Date(),
    };

    addPlayerToRound.mockResolvedValue(insertedPlayer);

    mockReq = {
      params: { id: roundId },
      body: { guestName },
      user: { userId: requestingUserId },
    };

    await addPlayerController(mockReq, mockRes, mockNext);

    expect(addPlayerToRound).toHaveBeenCalledWith(
      roundId,
      { guestName },
      requestingUserId,
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(insertedPlayer);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestingUserId = chance.integer({ min: 1001, max: 2000 });
    const serviceError = new Error('Service error');

    addPlayerToRound.mockRejectedValue(serviceError);

    mockReq = {
      params: { id: roundId },
      body: { userId },
      user: { userId: requestingUserId },
    };

    await addPlayerController(mockReq, mockRes, mockNext);

    expect(addPlayerToRound).toHaveBeenCalledWith(
      roundId,
      { userId },
      requestingUserId,
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(serviceError);
  });
});
