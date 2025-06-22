import friendsRoutes from '../../../routes/friends.routes.js';

describe('friendsRoutes', () => {
  test('should export a router', () => {
    expect(typeof friendsRoutes).toBe('function' || 'object');
    // If using express.Router(), it will be a function with router methods
    expect(friendsRoutes).toHaveProperty('use');
    expect(friendsRoutes).toHaveProperty('post');
  });
});
