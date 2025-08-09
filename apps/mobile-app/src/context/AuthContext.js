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

  // Logout function
  const logout = useCallback(async () => {
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
  }, [refreshTimer]);

  // Handle automatic token refresh
  const handleTokenRefresh = useCallback(async (currentRefreshToken) => {
    try {
      const newTokens = await refreshAccessToken(currentRefreshToken);

      // Update state with new tokens
      setTokens(newTokens);

      // Set up new refresh timer
      const timerId = setupTokenRefreshTimer(
        newTokens.accessToken,
        (nextRefreshToken) => handleTokenRefresh(nextRefreshToken),
      );
      setRefreshTimer(timerId);
    } catch (error) {
      // Refresh failed, logout user
      logout();
    }
  }, [logout]);

  // Restore authentication state from stored tokens on mount
  useEffect(() => {
    const restoreAuthState = async () => {
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
  }, [handleTokenRefresh]);

  // Manual token refresh function
  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken) {
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
      logout();
    }
  }, [tokens, refreshTimer, handleTokenRefresh, logout]);

  const login = useCallback(async ({ user: userData, tokens: authTokens }) => {
    try {
      // Store tokens securely
      await storeTokens(authTokens);

      // Update state
      setUser(userData);
      setTokens(authTokens);
      setIsAuthenticated(true);

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
    }
  }, [handleTokenRefresh]);

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
