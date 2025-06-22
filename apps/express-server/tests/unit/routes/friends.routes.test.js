import friendsRoutes from '../../../routes/friends.routes.js';

describe('friendsRoutes', () => {
  test('should export a router', () => {
    expect(typeof friendsRoutes).toBe('function' || 'object');
    expect(friendsRoutes).toHaveProperty('use');
    expect(friendsRoutes).toHaveProperty('post');
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
});
