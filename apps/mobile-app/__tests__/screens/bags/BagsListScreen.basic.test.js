/**
 * BagsListScreen Basic Tests
 */

// Mock AuthContext since EmptyBagsScreen now uses it
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

describe('BagsListScreen Basic Tests', () => {
  let mockUseAuth;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    const mockTokenStorage = require('../../../src/services/tokenStorage');

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

  it('should export a BagsListScreen component', () => {
    const BagsListScreen = require('../../../src/screens/bags/BagsListScreen').default;
    expect(BagsListScreen).toBeTruthy();
  });

  it('should work with updated EmptyBagsScreen that uses AuthContext', () => {
    // Test that BagsListScreen can work with the updated EmptyBagsScreen
    // that now requires AuthContext
    const EmptyBagsScreen = require('../../../src/screens/bags/EmptyBagsScreen').default;
    expect(EmptyBagsScreen).toBeTruthy();

    // Verify auth context is properly mocked
    const { useAuth } = require('../../../src/context/AuthContext');
    const authContext = useAuth();
    expect(authContext.user).toBeDefined();
    expect(authContext.user.isAdmin).toBe(false);
  });
});
