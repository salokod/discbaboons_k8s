import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import listPlayersController from '../../../controllers/rounds.listPlayers.controller.js';
import listPlayersService from '../../../services/rounds.listPlayers.service.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.listPlayers.service.js', () => ({
  default: vi.fn(),
}));

describe('rounds.listPlayers.controller', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {
        id: chance.guid(),
      },
      user: {
        userId: chance.guid(),
      },
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  test('should export a function', () => {
    expect(typeof listPlayersController).toBe('function');
  });

  test('should accept req, res, next parameters', async () => {
    listPlayersService.mockResolvedValue([]);

    await listPlayersController(req, res, next);

    expect(true).toBe(true); // Just checking it doesn't throw
  });

  test('should call service with roundId and userId', async () => {
    const mockPlayers = [];
    listPlayersService.mockResolvedValue(mockPlayers);

    await listPlayersController(req, res, next);

    expect(listPlayersService).toHaveBeenCalledWith(req.params.id, req.user.userId);
  });

  test('should return players via res.json', async () => {
    const mockPlayers = [
      {
        id: chance.guid(),
        round_id: chance.guid(),
        user_id: chance.guid(),
        is_guest: false,
        guest_name: null,
        username: chance.word(),
      },
    ];
    listPlayersService.mockResolvedValue(mockPlayers);

    await listPlayersController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockPlayers);
  });

  test('should handle errors by calling next', async () => {
    const error = new Error(chance.sentence());
    listPlayersService.mockRejectedValue(error);

    await listPlayersController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
