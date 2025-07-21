import {
  describe, it, expect, vi,
} from 'vitest';
import Chance from 'chance';
import { addPlayerToRound } from '../../../services/rounds.addPlayer.service.js';

const chance = new Chance();

describe('rounds.addPlayer.service', () => {
  describe('addPlayerToRound', () => {
    it('should export a function', () => {
      expect(typeof addPlayerToRound).toBe('function');
    });

    it('should accept roundId, playerData, requestingUserId, and db parameters', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const newPlayerId = chance.integer({ min: 1001, max: 2000 });
      const playerData = { userId: newPlayerId };
      const requestingUserId = creatorId; // User is the creator
      const insertedId = chance.guid();

      const db = {
        query: vi.fn()
          .mockResolvedValueOnce({
            rows: [{ id: roundId, created_by_id: creatorId }],
          }) // Round exists, user is creator
          .mockResolvedValueOnce({ rows: [] }) // Player is not a duplicate
          .mockResolvedValueOnce({
            rows: [{
              id: insertedId,
              round_id: roundId,
              user_id: newPlayerId,
              is_guest: false,
            }],
          }), // INSERT result
      };

      const result = await addPlayerToRound(roundId, playerData, requestingUserId, db);
      expect(result).toBeDefined();
      expect(result.id).toBe(insertedId);
    });

    it('should throw ValidationError if roundId is missing', async () => {
      const playerData = { userId: chance.integer({ min: 1, max: 1000 }) };
      const requestingUserId = chance.integer({ min: 1, max: 1000 });
      const db = { query: vi.fn() };

      await expect(addPlayerToRound(null, playerData, requestingUserId, db))
        .rejects.toThrow('Round ID is required');
    });

    it('should throw ValidationError if playerData is missing', async () => {
      const roundId = chance.guid();
      const requestingUserId = chance.integer({ min: 1, max: 1000 });
      const db = { query: vi.fn() };

      await expect(addPlayerToRound(roundId, null, requestingUserId, db))
        .rejects.toThrow('Player data is required');
    });

    it('should throw ValidationError if requestingUserId is missing', async () => {
      const roundId = chance.guid();
      const playerData = { userId: chance.integer({ min: 1, max: 1000 }) };
      const db = { query: vi.fn() };

      await expect(addPlayerToRound(roundId, playerData, null, db))
        .rejects.toThrow('Requesting user ID is required');
    });

    it('should throw ValidationError if playerData has neither userId nor guestName', async () => {
      const roundId = chance.guid();
      const playerData = {};
      const requestingUserId = chance.integer({ min: 1, max: 1000 });
      const db = { query: vi.fn() };

      await expect(addPlayerToRound(roundId, playerData, requestingUserId, db))
        .rejects.toThrow('Player data must include either userId or guestName');
    });

    it('should throw ValidationError if playerData has both userId and guestName', async () => {
      const roundId = chance.guid();
      const playerData = {
        userId: chance.integer({ min: 1, max: 1000 }),
        guestName: chance.name(),
      };
      const requestingUserId = chance.integer({ min: 1, max: 1000 });
      const db = { query: vi.fn() };

      await expect(addPlayerToRound(roundId, playerData, requestingUserId, db))
        .rejects.toThrow('Player data cannot have both userId and guestName');
    });

    it('should throw NotFoundError if round does not exist', async () => {
      const roundId = chance.guid();
      const playerData = { userId: chance.integer({ min: 1, max: 1000 }) };
      const requestingUserId = chance.integer({ min: 1, max: 1000 });
      const db = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      await expect(addPlayerToRound(roundId, playerData, requestingUserId, db))
        .rejects.toThrow('Round not found');
    });

    it('should throw AuthorizationError if user is not creator or player', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const requestingUserId = chance.integer({ min: 1001, max: 2000 }); // Different from creator
      const playerData = { userId: chance.integer({ min: 2001, max: 3000 }) };

      const db = {
        query: vi.fn()
          // eslint-disable-next-line max-len
          .mockResolvedValueOnce({ rows: [{ id: roundId, created_by_id: creatorId }] }) // Round exists
          .mockResolvedValueOnce({ rows: [] }), // User is not a player
      };

      await expect(addPlayerToRound(roundId, playerData, requestingUserId, db))
        .rejects.toThrow('You must be the round creator or a player to add new players');
    });

    it('should pass permission check if user is the round creator', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const requestingUserId = creatorId; // Same as creator
      const newPlayerId = chance.integer({ min: 2001, max: 3000 });
      const playerData = { userId: newPlayerId };
      const insertedId = chance.guid();

      const db = {
        query: vi.fn()
          .mockResolvedValueOnce({
            rows: [{ id: roundId, created_by_id: creatorId }],
          }) // Round exists
          .mockResolvedValueOnce({ rows: [] }) // Player is not a duplicate
          .mockResolvedValueOnce({
            rows: [{
              id: insertedId,
              round_id: roundId,
              user_id: newPlayerId,
              is_guest: false,
            }],
          }), // INSERT result
      };

      const result = await addPlayerToRound(roundId, playerData, requestingUserId, db);

      // Verify it returns the inserted player
      expect(result).toHaveProperty('id');
      expect(result.round_id).toBe(roundId);
      expect(result.user_id).toBe(newPlayerId);
    });

    it('should throw ConflictError if trying to add a user who is already a player', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const requestingUserId = creatorId;
      const existingPlayerId = chance.integer({ min: 2001, max: 3000 });
      const playerData = { userId: existingPlayerId };

      const db = {
        query: vi.fn()
          .mockResolvedValueOnce({
            rows: [{ id: roundId, created_by_id: creatorId }],
          }) // Round exists
          .mockResolvedValueOnce({
            rows: [{ id: chance.guid() }], // Player already exists
          }),
      };

      await expect(addPlayerToRound(roundId, playerData, requestingUserId, db))
        .rejects.toThrow('User is already a player in this round');
    });

    it('should successfully add a user player to the round', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const requestingUserId = creatorId;
      const newPlayerId = chance.integer({ min: 2001, max: 3000 });
      const playerData = { userId: newPlayerId };
      const insertedId = chance.guid();

      const db = {
        query: vi.fn()
          .mockResolvedValueOnce({
            rows: [{ id: roundId, created_by_id: creatorId }],
          }) // Round exists
          .mockResolvedValueOnce({ rows: [] }) // Player is not a duplicate
          .mockResolvedValueOnce({
            rows: [{
              id: insertedId,
              round_id: roundId,
              user_id: newPlayerId,
              is_guest: false,
            }],
          }), // INSERT result
      };

      const result = await addPlayerToRound(roundId, playerData, requestingUserId, db);

      expect(result).toEqual({
        id: insertedId,
        round_id: roundId,
        user_id: newPlayerId,
        is_guest: false,
      });

      // Verify the INSERT query was called with correct params
      expect(db.query).toHaveBeenCalledTimes(3);
      expect(db.query.mock.calls[2][0]).toContain('INSERT INTO round_players');
    });

    it('should successfully add a guest player to the round', async () => {
      const roundId = chance.guid();
      const creatorId = chance.integer({ min: 1, max: 1000 });
      const requestingUserId = creatorId;
      const guestName = chance.name();
      const playerData = { guestName };
      const insertedId = chance.guid();

      const db = {
        query: vi.fn()
          .mockResolvedValueOnce({
            rows: [{ id: roundId, created_by_id: creatorId }],
          }) // Round exists
          .mockResolvedValueOnce({
            rows: [{
              id: insertedId,
              round_id: roundId,
              user_id: null,
              guest_name: guestName,
              is_guest: true,
            }],
          }), // INSERT result (no duplicate check for guests)
      };

      const result = await addPlayerToRound(roundId, playerData, requestingUserId, db);

      expect(result).toEqual({
        id: insertedId,
        round_id: roundId,
        user_id: null,
        guest_name: guestName,
        is_guest: true,
      });

      // Verify only 2 queries for guest (no duplicate check)
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query.mock.calls[1][0]).toContain('INSERT INTO round_players');
      expect(db.query.mock.calls[1][0]).toContain('guest_name');
    });
  });
});
