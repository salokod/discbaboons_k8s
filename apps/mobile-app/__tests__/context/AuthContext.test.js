/**
 * AuthContext Tests
 */

import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

describe('AuthContext', () => {
  it('should export AuthContext and AuthProvider', () => {
    const { AuthContext, AuthProvider } = require('../../src/context/AuthContext');

    expect(AuthContext).toBeDefined();
    expect(AuthProvider).toBeDefined();
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

  it('should handle login', () => {
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

    // Initially not authenticated
    expect(getByTestId('auth-status').children[0]).toBe('false');
    expect(getByTestId('username').children[0]).toBe('none');

    // Login
    act(() => {
      getByTestId('login-button').props.onPress();
    });

    // Should be authenticated
    expect(getByTestId('auth-status').children[0]).toBe('true');
    expect(getByTestId('username').children[0]).toBe('testuser');
  });
});
