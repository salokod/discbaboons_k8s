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

  test('should have PUT /:id/discs/:contentId route for editing disc in bag with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const putEditDiscRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/:id/discs/:contentId'
        && layer.route.methods.put,
    );
    expect(putEditDiscRoute).toBeTruthy();
    const middlewareNames = (putEditDiscRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have PATCH /discs/:contentId/lost route for marking disc lost/found with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const patchLostRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/discs/:contentId/lost'
        && layer.route.methods.patch,
    );
    expect(patchLostRoute).toBeTruthy();
    const middlewareNames = (patchLostRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have GET /lost-discs route for listing lost discs with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const getLostDiscsRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/lost-discs'
        && layer.route.methods.get,
    );
    expect(getLostDiscsRoute).toBeTruthy();
    const middlewareNames = (getLostDiscsRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });

  test('should have DELETE /discs/:contentId route for removing disc from account with auth middleware', () => {
    const stack = bagsRoutes.stack || [];
    const deleteDiscRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/discs/:contentId'
        && layer.route.methods.delete,
    );
    expect(deleteDiscRoute).toBeTruthy();
    const middlewareNames = (deleteDiscRoute.route.stack || []).map((mw) => mw.name);
    expect(middlewareNames).toContain('authenticateToken');
  });
});
