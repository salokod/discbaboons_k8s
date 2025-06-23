import friendsRoutes from '../../../routes/friends.routes.js';

describe('friendsRoutes', () => {
  test('should export a router', () => {
    expect(typeof friendsRoutes).toBe('function' || 'object');
    expect(friendsRoutes).toHaveProperty('use');
    expect(friendsRoutes).toHaveProperty('post');
    expect(friendsRoutes).toHaveProperty('get');
  });

  test('should have POST /request route', () => {
    const stack = friendsRoutes.stack || [];
    const requestRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/request'
        && layer.route.methods.post,
    );
    expect(requestRoute).toBeTruthy();
  });

  test('should have POST /respond route', () => {
    const stack = friendsRoutes.stack || [];
    const respondRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/respond'
        && layer.route.methods.post,
    );
    expect(respondRoute).toBeTruthy();
  });

  test('should have GET /requests route', () => {
    const stack = friendsRoutes.stack || [];
    const requestsRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/requests'
        && layer.route.methods.get,
    );
    expect(requestsRoute).toBeTruthy();
  });

  test('should have GET / route for friends list', () => {
    const stack = friendsRoutes.stack || [];
    const friendsRoute = stack.find(
      (layer) => layer.route
        && layer.route.path === '/'
        && layer.route.methods.get,
    );
    expect(friendsRoute).toBeTruthy();
  });
});
