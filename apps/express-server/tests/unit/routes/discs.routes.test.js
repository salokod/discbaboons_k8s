import discsRoutes from '../../../routes/discs.routes.js';

describe('discsRoutes', () => {
  test('should export a router', () => {
    expect(typeof discsRoutes).toBe('function' || 'object');
    expect(discsRoutes).toHaveProperty('use');
    expect(discsRoutes).toHaveProperty('get');
    expect(discsRoutes).toHaveProperty('post');
  });

  test('should have GET /master route for disc listing with auth middleware', () => {
    const stack = discsRoutes.stack || [];
    const masterRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/master'
        && layer.route.methods.get,
    );
    expect(masterRoute).toBeTruthy();
    const middlewareNames = (masterRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have POST /master route for disc creation with auth middleware', () => {
    const stack = discsRoutes.stack || [];
    const masterPostRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/master'
        && layer.route.methods.post,
    );
    expect(masterPostRoute).toBeTruthy();
    const middlewareNames = (masterPostRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });
});
