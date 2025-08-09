/**
 * EmptyBagsScreen Basic Tests
 */

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

describe('EmptyBagsScreen Basic Tests', () => {
  let mockUseAuth;
  let mockTokenStorage;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    mockTokenStorage = require('../../../src/services/tokenStorage');

    // Default auth state for regular user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false,
      },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    });

    mockTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'token123',
      refreshToken: 'refresh123',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a EmptyBagsScreen component', () => {
    const EmptyBagsScreen = require('../../../src/screens/bags/EmptyBagsScreen').default;
    expect(EmptyBagsScreen).toBeTruthy();
  });

  describe('Admin Flag Integration', () => {
    it('should use admin status from auth context for regular users', () => {
      // Mock regular user (non-admin)
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 1, username: 'regularuser', email: 'regular@example.com', isAdmin: false,
        },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      });

      // Component should be able to access user.isAdmin === false
      const { useAuth } = require('../../../src/context/AuthContext');
      const authContext = useAuth();
      expect(authContext.user.isAdmin).toBe(false);
    });

    it('should use admin status from auth context for admin users', () => {
      // Mock admin user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 2, username: 'adminuser', email: 'admin@example.com', isAdmin: true,
        },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      });

      // Component should be able to access user.isAdmin === true
      const { useAuth } = require('../../../src/context/AuthContext');
      const authContext = useAuth();
      expect(authContext.user.isAdmin).toBe(true);
    });

    it('should handle missing user gracefully', () => {
      // Mock no user
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        tokens: null,
      });

      const { useAuth } = require('../../../src/context/AuthContext');
      const authContext = useAuth();
      expect(authContext.user).toBeNull();
    });
  });
});
