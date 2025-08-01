import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

const chance = new Chance();

// Mock the database module
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
}));

describe('sideBetsSuggestionsService', () => {
  let mockQueryOne;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import after mocking
    const { queryOne } = await import('../../../lib/database.js');
    mockQueryOne = queryOne;
  });

  it('should export a function', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    expect(typeof sideBetsSuggestionsService).toBe('function');
  });

  it('should throw error if roundId is missing', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });
    await expect(sideBetsSuggestionsService(null, userId)).rejects.toThrow('Round ID is required');
  });

  it('should throw error if userId is missing', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    await expect(sideBetsSuggestionsService(roundId, null)).rejects.toThrow('User ID is required');
  });

  it('should throw error for invalid UUID format', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const invalidRoundId = chance.string({ length: 10 }); // Not a valid UUID
    const userId = chance.integer({ min: 1, max: 1000 });
    await expect(sideBetsSuggestionsService(invalidRoundId, userId)).rejects.toThrow('Round ID must be a valid UUID');
  });

  it('should throw error for invalid userId format', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const invalidUserId = chance.string(); // Should be integer
    await expect(sideBetsSuggestionsService(roundId, invalidUserId)).rejects.toThrow('User ID must be a valid number');
  });

  it('should throw error if round not found', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock round not found
    mockQueryOne.mockResolvedValueOnce(null);

    await expect(sideBetsSuggestionsService(roundId, userId)).rejects.toThrow('Round not found');
  });

  it('should throw error if user not authorized', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1, max: 1000 });

    // Mock round found but user is not creator
    mockQueryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: creatorId,
    });
    // Mock user not in round_players
    mockQueryOne.mockResolvedValueOnce(null);

    await expect(sideBetsSuggestionsService(roundId, userId)).rejects.toThrow('You must be a participant in this round to view side bet suggestions');
  });

  it('should return suggestions object with categories for round creator', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock round found and user is creator
    mockQueryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    const result = await sideBetsSuggestionsService(roundId, userId);

    expect(result).toHaveProperty('roundId');
    expect(result).toHaveProperty('suggestions');
    expect(result.roundId).toBe(roundId);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should return suggestions for round participant', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    // Mock round found but user is not creator
    mockQueryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: creatorId,
    });
    // Mock user found in round_players
    mockQueryOne.mockResolvedValueOnce({ id: playerId });

    const result = await sideBetsSuggestionsService(roundId, userId);

    expect(result).toHaveProperty('roundId');
    expect(result).toHaveProperty('suggestions');
    expect(result.roundId).toBe(roundId);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should return suggestions with proper structure', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock round found and user is creator
    mockQueryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    const result = await sideBetsSuggestionsService(roundId, userId);

    expect(result.suggestions.length).toBeGreaterThan(0);
    const firstSuggestion = result.suggestions[0];

    expect(firstSuggestion).toHaveProperty('category');
    expect(firstSuggestion).toHaveProperty('name');
    expect(firstSuggestion).toHaveProperty('description');
    expect(firstSuggestion).toHaveProperty('popularity');
    expect(typeof firstSuggestion.popularity).toBe('number');
  });

  it('should return exactly 3 suggestions by default', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock round found and user is creator
    mockQueryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    const result = await sideBetsSuggestionsService(roundId, userId);

    expect(result.suggestions).toHaveLength(3);
  });
});
