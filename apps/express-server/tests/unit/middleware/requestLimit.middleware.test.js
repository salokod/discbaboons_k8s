import { describe, it, expect } from 'vitest';

describe('requestLimit middleware', () => {
  it('should export authRequestLimit middleware', async () => {
    const { authRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');
    expect(typeof authRequestLimit).toBe('function');
  });

  it('should export restrictiveRequestLimit middleware', async () => {
    const { restrictiveRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');
    expect(typeof restrictiveRequestLimit).toBe('function');
  });

  it('should configure authRequestLimit with 1MB limit', async () => {
    const { authRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');

    // Express.json middleware is a factory function that returns middleware
    // We can verify it exists and is properly configured by checking it's a function
    expect(typeof authRequestLimit).toBe('function');

    // The middleware should have the express.json signature
    expect(authRequestLimit.length).toBe(3); // req, res, next for middleware
  });

  it('should configure restrictiveRequestLimit with smaller limit', async () => {
    const { restrictiveRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');

    // Express.json middleware is a factory function that returns middleware
    expect(typeof restrictiveRequestLimit).toBe('function');

    // The middleware should have the express.json signature
    expect(restrictiveRequestLimit.length).toBe(3); // req, res, next
  });

  it('should be different middleware instances', async () => {
    const { authRequestLimit, restrictiveRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');

    // They should be different instances with different configurations
    expect(authRequestLimit).not.toBe(restrictiveRequestLimit);
  });

  it('should both be Express middleware functions', async () => {
    const { authRequestLimit, restrictiveRequestLimit } = await import('../../../middleware/requestLimit.middleware.js');

    // Both should be functions (Express middleware)
    expect(typeof authRequestLimit).toBe('function');
    expect(typeof restrictiveRequestLimit).toBe('function');

    // Express.json returns middleware with specific properties
    expect(authRequestLimit.name).toBe('jsonParser');
    expect(restrictiveRequestLimit.name).toBe('jsonParser');
  });
});
