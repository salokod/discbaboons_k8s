import { describe, it, expect } from 'vitest';

describe('roundsRequestLimit middleware', () => {
  it('should export roundsRequestLimit middleware', async () => {
    const { roundsRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');
    expect(typeof roundsRequestLimit).toBe('function');
  });

  it('should export roundsScoringRequestLimit middleware', async () => {
    const { roundsScoringRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');
    expect(typeof roundsScoringRequestLimit).toBe('function');
  });

  it('should configure roundsRequestLimit as Express middleware', async () => {
    const { roundsRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');

    // Express.json middleware is a factory function that returns middleware
    expect(typeof roundsRequestLimit).toBe('function');

    // The middleware should have the express.json signature
    expect(roundsRequestLimit.length).toBe(3); // req, res, next for middleware
    expect(roundsRequestLimit.name).toBe('jsonParser');
  });

  it('should configure roundsScoringRequestLimit as Express middleware', async () => {
    const { roundsScoringRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');

    // Express.json middleware is a factory function that returns middleware
    expect(typeof roundsScoringRequestLimit).toBe('function');

    // The middleware should have the express.json signature
    expect(roundsScoringRequestLimit.length).toBe(3); // req, res, next
    expect(roundsScoringRequestLimit.name).toBe('jsonParser');
  });

  it('should be different middleware instances', async () => {
    const { roundsRequestLimit, roundsScoringRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');

    // They should be different instances with different configurations
    expect(roundsRequestLimit).not.toBe(roundsScoringRequestLimit);
  });

  it('should both be Express middleware functions', async () => {
    const { roundsRequestLimit, roundsScoringRequestLimit } = await import('../../../middleware/roundsRequestLimit.middleware.js');

    // Both should be functions (Express middleware)
    expect(typeof roundsRequestLimit).toBe('function');
    expect(typeof roundsScoringRequestLimit).toBe('function');

    // Express.json returns middleware with specific properties
    expect(roundsRequestLimit.name).toBe('jsonParser');
    expect(roundsScoringRequestLimit.name).toBe('jsonParser');
  });
});
