/**
 * AuthContext Tests
 */

describe('AuthContext', () => {
  it('should export AuthContext and AuthProvider', () => {
    const { AuthContext, AuthProvider } = require('../../src/context/AuthContext');
    
    expect(AuthContext).toBeDefined();
    expect(AuthProvider).toBeDefined();
  });
});