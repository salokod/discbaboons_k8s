import discsRoutes from '../../../routes/discs.routes.js';

describe('discsRoutes', () => {
  test('should export a router', () => {
    expect(typeof discsRoutes).toBe('function' || 'object');
    expect(discsRoutes).toHaveProperty('use');
    expect(discsRoutes).toHaveProperty('get');
  });

  test('should have GET /master route for disc listing with auth middleware', () => {
    const stack = discsRoutes.stack || [];
    const masterRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/master'
        && layer.route.methods.get,
    );
    expect(masterRoute).toBeTruthy();
    // Check that the middleware stack includes authenticateToken
    const middlewareNames = (masterRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });
});
