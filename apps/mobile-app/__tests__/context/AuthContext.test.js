/**
 * AuthContext Tests
 */

import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

// Mock token storage service
jest.mock('../../src/services/tokenStorage', () => ({
  storeTokens: jest.fn(),
  getTokens: jest.fn(),
  clearTokens: jest.fn(),
  hasStoredTokens: jest.fn(),
  setLogoutFlag: jest.fn(),
  isLoggedOut: jest.fn(),
  clearLogoutFlag: jest.fn(),
}));

// Mock token refresh service
jest.mock('../../src/services/tokenRefresh', () => ({
  refreshAccessToken: jest.fn(),
  isTokenExpired: jest.fn(),
  setupTokenRefreshTimer: jest.fn(),
  clearTokenRefreshTimer: jest.fn(),
}));

describe('AuthContext', () => {
  let mockTokenStorage;
  let mockTokenRefresh;

  beforeEach(() => {
    mockTokenStorage = require('../../src/services/tokenStorage');
    mockTokenRefresh = require('../../src/services/tokenRefresh');

    // Clear all mocks
    mockTokenStorage.storeTokens.mockClear();
    mockTokenStorage.getTokens.mockClear();
    mockTokenStorage.clearTokens.mockClear();
    mockTokenStorage.hasStoredTokens.mockClear();
    mockTokenStorage.setLogoutFlag.mockClear();
    mockTokenStorage.isLoggedOut.mockClear();
    mockTokenStorage.clearLogoutFlag.mockClear();
    mockTokenRefresh.refreshAccessToken.mockClear();
    mockTokenRefresh.isTokenExpired.mockClear();
    mockTokenRefresh.setupTokenRefreshTimer.mockClear();
    mockTokenRefresh.clearTokenRefreshTimer.mockClear();

    // Default mocks for most tests
    mockTokenStorage.getTokens.mockResolvedValue(null);
    mockTokenStorage.isLoggedOut.mockResolvedValue(false);
    mockTokenStorage.setLogoutFlag.mockResolvedValue(true);
    mockTokenStorage.clearLogoutFlag.mockResolvedValue(true);
    mockTokenRefresh.isTokenExpired.mockReturnValue(false);
  });

  it('should export AuthContext and AuthProvider', () => {
    const { AuthContext, AuthProvider: AuthProviderExport } = require('../../src/context/AuthContext');

    expect(AuthContext).toBeDefined();
    expect(AuthProviderExport).toBeDefined();
  });

  it('should provide default auth state', () => {
    function TestComponent() {
      const { isAuthenticated, user } = useAuth();
      return (
        <>
          <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
          <Text testID="user">{user ? JSON.stringify(user) : 'null'}</Text>
        </>
      );
    }

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(getByTestId('auth-status').children[0]).toBe('false');
    expect(getByTestId('user').children[0]).toBe('null');
  });

  it('should handle login', async () => {
    mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
    mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

    function TestComponent() {
      const { isAuthenticated, user, login } = useAuth();

      const handleLogin = () => {
        login({
          user: { id: 1, username: 'testuser' },
          tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
        });
      };

      return (
        <>
          <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
          <Text testID="username">{user?.username || 'none'}</Text>
          <Text testID="login-button" onPress={handleLogin}>Login</Text>
        </>
      );
    }

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('auth-status').children[0]).toBe('false');
    });

    expect(getByTestId('username').children[0]).toBe('none');

    // Login
    await act(async () => {
      getByTestId('login-button').props.onPress();
    });

    // Should be authenticated
    expect(getByTestId('auth-status').children[0]).toBe('true');
    expect(getByTestId('username').children[0]).toBe('testuser');
  });

  describe('Token Persistence', () => {
    it('should restore authentication state from stored tokens on mount', async () => {
      const storedTokens = {
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      };

      const storedUser = {
        id: 1,
        username: 'storeduser',
        email: 'stored@example.com',
      };

      // Override default mocks for this test
      mockTokenStorage.getTokens.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();

      // Mock stored tokens and valid token
      mockTokenStorage.getTokens.mockResolvedValueOnce(storedTokens);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(false);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock a valid JWT token structure: header.payload.signature
      const mockPayload = {
        userId: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      // Create a mock JWT token with 3 parts
      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      storedTokens.accessToken = mockJWTToken;

      // Mock base64 decode for JWT payload
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { isAuthenticated, user, isLoading } = useAuth();
        return (
          <>
            <Text testID="loading">{isLoading ? 'true' : 'false'}</Text>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Should start with loading
      expect(getByTestId('loading').children[0]).toBe('true');

      // Wait for token restoration
      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      // Should be authenticated with restored user
      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('username').children[0]).toBe('storeduser');
      expect(mockTokenRefresh.setupTokenRefreshTimer).toHaveBeenCalledWith(
        storedTokens.accessToken,
        expect.any(Function),
      );
    });

    it('should handle expired stored tokens by clearing them', async () => {
      const expiredTokens = {
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
      };

      // Mock expired tokens
      mockTokenStorage.getTokens.mockResolvedValueOnce(expiredTokens);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(true);
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);

      function TestComponent() {
        const { isAuthenticated, isLoading } = useAuth();
        return (
          <>
            <Text testID="loading">{isLoading ? 'true' : 'false'}</Text>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for token check
      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      // Should not be authenticated and tokens should be cleared
      expect(getByTestId('auth-status').children[0]).toBe('false');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should store tokens securely on login and clear logout flag', async () => {
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      function TestComponent() {
        const { login } = useAuth();

        const handleLogin = () => {
          login({
            user: { id: 1, username: 'testuser' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          });
        };

        return <Text testID="login-button" onPress={handleLogin}>Login</Text>;
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(mockTokenStorage.clearLogoutFlag).toHaveBeenCalled();
      expect(mockTokenStorage.storeTokens).toHaveBeenCalledWith({
        accessToken: 'token123',
        refreshToken: 'refresh123',
      });
      expect(mockTokenRefresh.setupTokenRefreshTimer).toHaveBeenCalled();
    });

    it('should clear tokens and refresh timer on logout and set logout flag', async () => {
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);
      mockTokenStorage.setLogoutFlag.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      function TestComponent() {
        const { logout, login } = useAuth();

        const handleLogin = () => {
          login({
            user: { id: 1, username: 'testuser' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          });
        };

        return (
          <>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="logout-button" onPress={logout}>Logout</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Login first to set up refresh timer
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(mockTokenStorage.clearLogoutFlag).toHaveBeenCalled();

      // Then logout
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

      expect(mockTokenStorage.setLogoutFlag).toHaveBeenCalled();
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      expect(mockTokenRefresh.clearTokenRefreshTimer).toHaveBeenCalled();
    });
  });

  describe('Token Refresh Integration', () => {
    it('should refresh tokens automatically when needed', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockTokenRefresh.refreshAccessToken.mockResolvedValueOnce(newTokens);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(54321);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});

      function TestComponent() {
        const { refreshTokens, tokens, login } = useAuth();

        const handleLogin = () => {
          login({
            user: { id: 1, username: 'testuser' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          });
        };

        return (
          <>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="refresh-button" onPress={refreshTokens}>Refresh</Text>
            <Text testID="has-tokens">{tokens ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // First login to have tokens
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      // Then refresh tokens
      await act(async () => {
        getByTestId('refresh-button').props.onPress();
      });

      expect(mockTokenRefresh.refreshAccessToken).toHaveBeenCalledWith('refresh123');
      expect(mockTokenRefresh.setupTokenRefreshTimer).toHaveBeenCalledWith(
        newTokens.accessToken,
        expect.any(Function),
      );
    });

    it('should logout on refresh failure', async () => {
      mockTokenRefresh.refreshAccessToken.mockRejectedValueOnce(
        new Error('Invalid or expired refresh token'),
      );
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});

      function TestComponent() {
        const { refreshTokens, isAuthenticated, login } = useAuth();

        const handleLogin = () => {
          login({
            user: { id: 1, username: 'testuser' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          });
        };

        return (
          <>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="refresh-button" onPress={refreshTokens}>Refresh</Text>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // First login to have tokens
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      // Should be authenticated
      expect(getByTestId('auth-status').children[0]).toBe('true');

      // Then try to refresh tokens (will fail)
      await act(async () => {
        getByTestId('refresh-button').props.onPress();
      });

      // Should be logged out after refresh failure
      expect(getByTestId('auth-status').children[0]).toBe('false');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('Logout Security', () => {
    it('should NOT restore tokens after logout even if Metro refresh happens (security fix)', async () => {
      // This test verifies our fix - tokens should NOT be restored after logout

      const persistentTokens = {
        accessToken: 'still-there-token',
        refreshToken: 'still-there-refresh',
      };

      const mockPayload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      persistentTokens.accessToken = mockJWTToken;
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      // First render - user logs in
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});

      function TestComponent() {
        const {
          isAuthenticated, user, login, logout,
        } = useAuth();

        const handleLogin = () => {
          login({
            user: {
              id: 1, username: 'testuser',
            },
            tokens: persistentTokens,
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="logout-button" onPress={logout}>Logout</Text>
          </>
        );
      }

      const { getByTestId, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(getByTestId('auth-status').children[0]).toBe('false');
      });

      // Login
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('username').children[0]).toBe('testuser');
      expect(mockTokenStorage.clearLogoutFlag).toHaveBeenCalled();

      // Mock logout setting the logout flag
      mockTokenStorage.setLogoutFlag.mockResolvedValueOnce(true);
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);

      // Logout
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

      // Should be logged out initially
      expect(getByTestId('auth-status').children[0]).toBe('false');
      expect(getByTestId('username').children[0]).toBe('none');
      expect(mockTokenStorage.setLogoutFlag).toHaveBeenCalled();

      // Unmount to simulate Metro refresh
      unmount();

      // Simulate Metro refresh - tokens might still be in storage but logout flag is set
      mockTokenStorage.getTokens.mockReset();
      mockTokenStorage.isLoggedOut.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();

      // The logout flag is set, so isLoggedOut returns true
      mockTokenStorage.isLoggedOut.mockResolvedValueOnce(true);
      mockTokenStorage.getTokens.mockResolvedValueOnce(persistentTokens); // Tokens still there
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(false);

      // Re-render (simulating Metro refresh)
      const { getByTestId: getByTestIdAfterRefresh } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for loading to complete
      await waitFor(() => {
        // FIXED: User should stay logged out because logout flag is set
        expect(getByTestIdAfterRefresh('auth-status').children[0]).toBe('false');
      });

      // Security is maintained - user stays logged out
      expect(getByTestIdAfterRefresh('username').children[0]).toBe('none');
      expect(mockTokenStorage.isLoggedOut).toHaveBeenCalled();
    });

    it('should prevent token restoration after logout even during app restart', async () => {
      // This test shows what SHOULD happen - user should stay logged out
      // We'll implement a fix that sets a persistent flag in storage during logout

      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
      };

      const mockPayload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      tokens.accessToken = mockJWTToken;
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      // Mock that clearTokens actually works completely
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});

      function TestComponent() {
        const {
          isAuthenticated, user, login, logout,
        } = useAuth();

        const handleLogin = () => {
          login({
            user: {
              id: 1, username: 'testuser',
            },
            tokens,
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="logout-button" onPress={logout}>Logout</Text>
          </>
        );
      }

      const { getByTestId, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Login
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(getByTestId('auth-status').children[0]).toBe('true');

      // Logout
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

      expect(getByTestId('auth-status').children[0]).toBe('false');

      // Simulate app restart - no tokens should be found
      unmount();

      mockTokenStorage.getTokens.mockReset();
      mockTokenStorage.getTokens.mockResolvedValueOnce(null); // No tokens after proper logout

      const { getByTestId: getByTestIdAfterRestart } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(getByTestIdAfterRestart('auth-status').children[0]).toBe('false');
      });

      expect(getByTestIdAfterRestart('username').children[0]).toBe('none');
    });

    it('should handle race conditions in logout process using storage-based logout flag', async () => {
      // This test verifies our fix handles race conditions properly
      const tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
      };

      const mockPayload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      tokens.accessToken = mockJWTToken;
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      // Mock slow token clearing to simulate race condition
      mockTokenStorage.clearTokens.mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        return true;
      });

      // Mock fast logout flag setting (this should complete first)
      mockTokenStorage.setLogoutFlag.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);
      mockTokenRefresh.clearTokenRefreshTimer.mockImplementation(() => {});

      function TestComponent() {
        const {
          isAuthenticated, logout, login,
        } = useAuth();

        const handleLogin = () => {
          login({
            user: {
              id: 1, username: 'testuser',
            },
            tokens,
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
            <Text testID="logout-button" onPress={logout}>Logout</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Login
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(mockTokenStorage.clearLogoutFlag).toHaveBeenCalled();

      // Logout - logout flag should be set first, then tokens cleared
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

      // Should be logged out immediately (state cleared)
      expect(getByTestId('auth-status').children[0]).toBe('false');

      // Verify logout flag was set (this is our security mechanism)
      expect(mockTokenStorage.setLogoutFlag).toHaveBeenCalled();

      // The clearTokens call should also eventually complete
      await waitFor(() => {
        expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      });
    });
  });

  describe('Admin Flag Support', () => {
    it('should extract admin status from JWT token during login - admin user', async () => {
      // This test reproduces the bug where admin status is lost after logout/login
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock JWT payload for admin user
      const mockPayload = {
        userId: 1,
        username: 'adminuser',
        email: 'admin@example.com',
        isAdmin: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { user, isAuthenticated, login } = useAuth();

        const handleLogin = () => {
          login({
            // API response might not include isAdmin correctly
            user: { id: 1, username: 'adminuser', email: 'admin@example.com' },
            tokens: { accessToken: mockJWTToken, refreshToken: 'refresh123' },
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(getByTestId('auth-status').children[0]).toBe('false');
      });

      // Login with admin user
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      // Should be authenticated and have admin privileges from JWT
      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('username').children[0]).toBe('adminuser');
      expect(getByTestId('isAdmin').children[0]).toBe('true'); // CURRENTLY FAILS - this is the bug
    });

    it('should extract admin status from JWT token during login - regular user', async () => {
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock JWT payload for regular user
      const mockPayload = {
        userId: 2,
        username: 'regularuser',
        email: 'regular@example.com',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { user, isAuthenticated, login } = useAuth();

        const handleLogin = () => {
          login({
            // API response might incorrectly include isAdmin or omit it
            user: {
              id: 2, username: 'regularuser', email: 'regular@example.com', isAdmin: true,
            },
            tokens: { accessToken: mockJWTToken, refreshToken: 'refresh123' },
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(getByTestId('auth-status').children[0]).toBe('false');
      });

      // Login with regular user
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      // Should be authenticated but NOT have admin privileges (JWT should override API response)
      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('username').children[0]).toBe('regularuser');
      expect(getByTestId('isAdmin').children[0]).toBe('false'); // JWT should override API response
    });

    it('should maintain consistency between login and token restoration flows for admin status', async () => {
      // This test ensures both flows extract admin status the same way
      const adminTokens = {
        accessToken: 'admin-access-token',
        refreshToken: 'admin-refresh-token',
      };

      const mockPayload = {
        userId: 1,
        username: 'adminuser',
        email: 'admin@example.com',
        isAdmin: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      adminTokens.accessToken = mockJWTToken;

      // First test: login flow
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenStorage.clearLogoutFlag.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { user, isAuthenticated, login } = useAuth();

        const handleLogin = () => {
          login({
            user: { id: 1, username: 'adminuser', email: 'admin@example.com' }, // No isAdmin in API response
            tokens: adminTokens,
          });
        };

        return (
          <>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
            <Text testID="login-button" onPress={handleLogin}>Login</Text>
          </>
        );
      }

      const { getByTestId, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Login flow
      await act(async () => {
        getByTestId('login-button').props.onPress();
      });

      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('isAdmin').children[0]).toBe('true'); // Should extract from JWT

      unmount();

      // Second test: token restoration flow (reset mocks)
      mockTokenStorage.getTokens.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();
      mockTokenStorage.isLoggedOut.mockReset();

      mockTokenStorage.getTokens.mockResolvedValueOnce(adminTokens);
      mockTokenStorage.isLoggedOut.mockResolvedValueOnce(false);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(false);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);
      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      const { getByTestId: getByTestIdRestoration } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for token restoration
      await waitFor(() => {
        expect(getByTestIdRestoration('auth-status').children[0]).toBe('true');
      });

      // Should have same admin status as login flow
      expect(getByTestIdRestoration('isAdmin').children[0]).toBe('true');
    });

    it('should extract isAdmin from JWT token payload for regular users', async () => {
      const storedTokens = {
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      };

      const regularUser = {
        id: 1,
        username: 'regularuser',
        email: 'regular@example.com',
      };

      // Override default mocks for this test
      mockTokenStorage.getTokens.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();

      mockTokenStorage.getTokens.mockResolvedValueOnce(storedTokens);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(false);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock JWT payload for regular user (no isAdmin field)
      const mockPayload = {
        userId: regularUser.id,
        username: regularUser.username,
        email: regularUser.email,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      storedTokens.accessToken = mockJWTToken;

      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { user, isLoading } = useAuth();
        return (
          <>
            <Text testID="loading">{isLoading ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for token restoration
      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      expect(getByTestId('username').children[0]).toBe('regularuser');
      expect(getByTestId('isAdmin').children[0]).toBe('false');
    });

    it('should extract isAdmin from JWT token payload for admin users', async () => {
      const storedTokens = {
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      };

      const adminUser = {
        id: 2,
        username: 'adminuser',
        email: 'admin@example.com',
      };

      // Override default mocks for this test
      mockTokenStorage.getTokens.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();

      mockTokenStorage.getTokens.mockResolvedValueOnce(storedTokens);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(false);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock JWT payload for admin user (with isAdmin: true)
      const mockPayload = {
        userId: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockJWTToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      storedTokens.accessToken = mockJWTToken;

      global.atob = jest.fn().mockReturnValue(JSON.stringify(mockPayload));

      function TestComponent() {
        const { user, isLoading } = useAuth();
        return (
          <>
            <Text testID="loading">{isLoading ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for token restoration
      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      expect(getByTestId('username').children[0]).toBe('adminuser');
      expect(getByTestId('isAdmin').children[0]).toBe('true');
    });

    it('should handle token refresh and preserve admin status', async () => {
      const initialTokens = {
        accessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
      };

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      // Override default mocks
      mockTokenStorage.getTokens.mockReset();
      mockTokenRefresh.isTokenExpired.mockReset();

      mockTokenStorage.getTokens.mockResolvedValueOnce(initialTokens);
      mockTokenRefresh.isTokenExpired.mockReturnValueOnce(true); // Token is expired
      mockTokenRefresh.refreshAccessToken.mockResolvedValueOnce(newTokens);
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
      mockTokenRefresh.setupTokenRefreshTimer.mockReturnValueOnce(12345);

      // Mock JWT payload for admin user - should be preserved after refresh
      const mockPayload = {
        userId: 2,
        username: 'adminuser',
        email: 'admin@example.com',
        isAdmin: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Mock both initial and refreshed token payloads
      global.atob = jest.fn()
        .mockReturnValueOnce(JSON.stringify(mockPayload)) // Initial token decode
        .mockReturnValueOnce(JSON.stringify(mockPayload)); // Refreshed token decode

      // Mock the new token structure
      newTokens.accessToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      function TestComponent() {
        const { user, isLoading, isAuthenticated } = useAuth();
        return (
          <>
            <Text testID="loading">{isLoading ? 'true' : 'false'}</Text>
            <Text testID="auth-status">{isAuthenticated ? 'true' : 'false'}</Text>
            <Text testID="username">{user?.username || 'none'}</Text>
            <Text testID="isAdmin">{user?.isAdmin ? 'true' : 'false'}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for token refresh to complete
      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      // Should be authenticated with admin privileges preserved
      expect(getByTestId('auth-status').children[0]).toBe('true');
      expect(getByTestId('username').children[0]).toBe('adminuser');
      expect(getByTestId('isAdmin').children[0]).toBe('true');
      expect(mockTokenRefresh.refreshAccessToken).toHaveBeenCalledWith('initial-refresh-token');
    });
  });
});
