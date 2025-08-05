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
    mockTokenRefresh.refreshAccessToken.mockClear();
    mockTokenRefresh.isTokenExpired.mockClear();
    mockTokenRefresh.setupTokenRefreshTimer.mockClear();
    mockTokenRefresh.clearTokenRefreshTimer.mockClear();

    // Default mocks for most tests
    mockTokenStorage.getTokens.mockResolvedValue(null);
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

    it('should store tokens securely on login', async () => {
      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);
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

      expect(mockTokenStorage.storeTokens).toHaveBeenCalledWith({
        accessToken: 'token123',
        refreshToken: 'refresh123',
      });
      expect(mockTokenRefresh.setupTokenRefreshTimer).toHaveBeenCalled();
    });

    it('should clear tokens and refresh timer on logout', async () => {
      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);
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

      // Then logout
      await act(async () => {
        getByTestId('logout-button').props.onPress();
      });

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
});
