import { describe, it, expect } from 'vitest';
import sideBetsSuggestionsService from '../../../services/sideBets.suggestions.service.js';

describe('sideBetsSuggestionsService', () => {
  it('should export a function', () => {
    expect(typeof sideBetsSuggestionsService).toBe('function');
  });

  it('should throw error if roundId is missing', async () => {
    await expect(sideBetsSuggestionsService(null, 123)).rejects.toThrow('Round ID is required');
  });

  it('should throw error if userId is missing', async () => {
    await expect(sideBetsSuggestionsService('round-123', null)).rejects.toThrow('User ID is required');
  });

  it('should return suggestions object with categories', async () => {
    const result = await sideBetsSuggestionsService('round-123', 123);

    expect(result).toHaveProperty('roundId');
    expect(result).toHaveProperty('suggestions');
    expect(result.roundId).toBe('round-123');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should return suggestions with proper structure', async () => {
    const result = await sideBetsSuggestionsService('round-123', 123);

    expect(result.suggestions.length).toBeGreaterThan(0);
    const firstSuggestion = result.suggestions[0];

    expect(firstSuggestion).toHaveProperty('category');
    expect(firstSuggestion).toHaveProperty('name');
    expect(firstSuggestion).toHaveProperty('description');
    expect(firstSuggestion).toHaveProperty('popularity');
  });
});
