import { describe, test, expect } from '@jest/globals';
import authRoutes from '../../../routes/auth.routes.js';

describe('AuthRoutes', () => {
  test('should exist', () => {
    // Simple placeholder test to start
    expect(true).toBe(true);
  });

  test('should export an Express router', () => {
    expect(authRoutes).toBeDefined();
    expect(typeof authRoutes).toBe('function'); // Express routers are functions
  });

  test('should have POST /register route', () => {
    // Check that the router has routes defined
    const routes = authRoutes.stack || [];
    const postRoutes = routes.filter((layer) => layer.route
      && layer.route.methods.post
      && layer.route.path === '/register');

    expect(postRoutes.length).toBe(1);
  });
});
