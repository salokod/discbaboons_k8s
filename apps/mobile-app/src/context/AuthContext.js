/**
 * AuthContext for global authentication state
 */

import {
  createContext, useContext, useState, useMemo,
} from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  const login = ({ user: userData, tokens: authTokens }) => {
    setUser(userData);
    setTokens(authTokens);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    tokens,
    login,
    logout,
  }), [isAuthenticated, user, tokens]);

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
