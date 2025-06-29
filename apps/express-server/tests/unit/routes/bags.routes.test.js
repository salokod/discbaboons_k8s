import bagsRoutes from '../../../routes/bags.routes.js';

describe('bagsRoutes', () => {
  test('should export a router', () => {
    expect(typeof bagsRoutes).toBe('function' || 'object');
    expect(bagsRoutes).toHaveProperty('use');
    expect(bagsRoutes).toHaveProperty('get');
    expect(bagsRoutes).toHaveProperty('post');
  });

  test('should have POST / route for bag creation with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const postRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/'
        && layer.route.methods.post,
    );
    expect(postRoute).toBeTruthy();
    const middlewareNames = (postRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });
});
