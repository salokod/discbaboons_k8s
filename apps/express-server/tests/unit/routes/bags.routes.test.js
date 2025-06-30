import bagsRoutes from '../../../routes/bags.routes.js';

describe('bagsRoutes', () => {
  test('should export a router', () => {
    expect(typeof bagsRoutes).toBe('function' || 'object');
    expect(bagsRoutes).toHaveProperty('use');
    expect(bagsRoutes).toHaveProperty('get');
    expect(bagsRoutes).toHaveProperty('post');
    expect(bagsRoutes).toHaveProperty('put');
    expect(bagsRoutes).toHaveProperty('delete');
  });

  test('should have GET / route for bag listing with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const getRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/'
        && layer.route.methods.get,
    );
    expect(getRoute).toBeTruthy();
    const middlewareNames = (getRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have GET /:id route for getting single bag with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const getIdRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/:id'
        && layer.route.methods.get,
    );
    expect(getIdRoute).toBeTruthy();
    const middlewareNames = (getIdRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
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

  test('should have PUT /:id route for bag update with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const putRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/:id'
        && layer.route.methods.put,
    );
    expect(putRoute).toBeTruthy();
    const middlewareNames = (putRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have DELETE /:id route for bag deletion with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const deleteRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/:id'
        && layer.route.methods.delete,
    );
    expect(deleteRoute).toBeTruthy();
    const middlewareNames = (deleteRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have POST /:id/discs route for adding disc to bag with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const postDiscsRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/:id/discs'
        && layer.route.methods.post,
    );
    expect(postDiscsRoute).toBeTruthy();
    const middlewareNames = (postDiscsRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });
});
