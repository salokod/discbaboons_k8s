/**
 * AuthContext for global authentication state with token persistence and refresh
 */

import {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { storeTokens, getTokens, clearTokens } from '../services/tokenStorage';
import {
  refreshAccessToken,
  isTokenExpired,
  setupTokenRefreshTimer,
  clearTokenRefreshTimer,
} from '../services/tokenRefresh';

export const AuthContext = createContext();

// Helper function to decode JWT payload
function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Logout function
  const logout = useCallback(async () => {
    // Set flag to prevent token restoration during logout
    setIsLoggingOut(true);

    try {
      // Clear stored tokens
      await clearTokens();
    } catch (error) {
      // Continue with logout even if clearing tokens fails
    }

    // Clear refresh timer
    if (refreshTimer) {
      clearTokenRefreshTimer(refreshTimer);
      setRefreshTimer(null);
    }

    // Clear state
    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);

    // Reset logout flag after state is cleared
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 100);
  }, [refreshTimer]);

  // Handle automatic token refresh - moved after logout to avoid circular dependency
  const handleTokenRefresh = useCallback(async (currentRefreshToken) => {
    // Don't attempt refresh if logging out
    if (isLoggingOut) {
      return;
    }

    try {
      const newTokens = await refreshAccessToken(currentRefreshToken);

      // Extract user data from new access token
      const parts = newTokens.accessToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid access token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      const userData = {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        isAdmin: payload.isAdmin || false,
      };

      // Update state with new tokens AND user data
      setTokens(newTokens);
      setUser(userData);

      // Set up new refresh timer
      const timerId = setupTokenRefreshTimer(
        newTokens.accessToken,
        (nextRefreshToken) => handleTokenRefresh(nextRefreshToken),
      );
      setRefreshTimer(timerId);
    } catch (error) {
      // Refresh failed, logout user
      if (!isLoggingOut) {
        logout();
      }
    }
  }, [isLoggingOut, logout]);

  // Restore authentication state from stored tokens on mount
  useEffect(() => {
    const restoreAuthState = async () => {
      // Don't restore tokens if we're in the middle of logging out
      if (isLoggingOut) {
        setIsLoading(false);
        return;
      }

      try {
        const storedTokens = await getTokens();

        if (!storedTokens) {
          setIsLoading(false);
          return;
        }

        // Check if access token is expired
        if (isTokenExpired(storedTokens.accessToken)) {
          // Try to refresh with refresh token instead of logging out
          if (storedTokens.refreshToken) {
            try {
              const newTokens = await refreshAccessToken(storedTokens.refreshToken);

              // Store new tokens
              await storeTokens(newTokens);

              // Update state with refreshed tokens
              const payload = decodeJWTPayload(newTokens.accessToken);
              if (payload) {
                const userData = {
                  id: payload.userId,
                  username: payload.username,
                  email: payload.email,
                  isAdmin: payload.isAdmin || false,
                };

                setUser(userData);
                setTokens(newTokens);
                setIsAuthenticated(true);

                // Set up token refresh timer
                const timerId = setupTokenRefreshTimer(
                  newTokens.accessToken,
                  () => handleTokenRefresh(newTokens.refreshToken),
                );
                setRefreshTimer(timerId);
                setIsLoading(false);
                return;
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and continue to logout
            }
          }

          // Clear expired tokens if refresh failed or no refresh token
          await clearTokens();
          setIsLoading(false);
          return;
        }

        // Extract user info from access token
        const payload = decodeJWTPayload(storedTokens.accessToken);
        if (!payload) {
          await clearTokens();
          setIsLoading(false);
          return;
        }

        // Restore authentication state
        const userData = {
          id: payload.userId,
          username: payload.username,
          email: payload.email,
          isAdmin: payload.isAdmin || false,
        };

        setUser(userData);
        setTokens(storedTokens);
        setIsAuthenticated(true);

        // Set up token refresh timer
        const timerId = setupTokenRefreshTimer(
          storedTokens.accessToken,
          () => handleTokenRefresh(storedTokens.refreshToken),
        );
        setRefreshTimer(timerId);
      } catch (error) {
        // Error restoring state, clear any stored tokens
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - intentionally ignoring dependencies

  // Manual token refresh function
  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken || isLoggingOut) {
      return;
    }

    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);

      // Update state with new tokens
      setTokens(newTokens);

      // Clear existing timer and set up new one
      if (refreshTimer) {
        clearTokenRefreshTimer(refreshTimer);
      }

      const timerId = setupTokenRefreshTimer(
        newTokens.accessToken,
        () => handleTokenRefresh(newTokens.refreshToken),
      );
      setRefreshTimer(timerId);
    } catch (error) {
      // Refresh failed, logout user
      if (!isLoggingOut) {
        logout();
      }
    }
  }, [tokens, refreshTimer, handleTokenRefresh, logout, isLoggingOut]);

  const login = useCallback(async ({ user: userData, tokens: authTokens }) => {
    // Prevent login during logout
    if (isLoggingOut) {
      return;
    }

    try {
      // Store tokens securely
      await storeTokens(authTokens);

      // Update state
      setUser(userData);
      setTokens(authTokens);
      setIsAuthenticated(true);
      setIsLoggingOut(false); // Ensure logout flag is reset

      // Set up token refresh timer
      const timerId = setupTokenRefreshTimer(
        authTokens.accessToken,
        () => handleTokenRefresh(authTokens.refreshToken),
      );
      setRefreshTimer(timerId);
    } catch (error) {
      // Failed to store tokens, but still set state for current session
      setUser(userData);
      setTokens(authTokens);
      setIsAuthenticated(true);
      setIsLoggingOut(false); // Ensure logout flag is reset
    }
  }, [handleTokenRefresh, isLoggingOut]);

  // Clean up timer on unmount
  useEffect(() => () => {
    if (refreshTimer) {
      clearTokenRefreshTimer(refreshTimer);
    }
  }, [refreshTimer]);

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    tokens,
    isLoading,
    login,
    logout,
    refreshTokens,
  }), [isAuthenticated, user, tokens, isLoading, login, logout, refreshTokens]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
