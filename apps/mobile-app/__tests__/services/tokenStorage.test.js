/**
 * Token Storage Service Tests
 */

import {
  storeTokens,
  getTokens,
  clearTokens,
  hasStoredTokens,
} from '../../src/services/tokenStorage';

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  hasInternetCredentials: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

describe('TokenStorage Service', () => {
  let mockKeychain;

  beforeEach(() => {
    mockKeychain = require('react-native-keychain');

    // Clear all mocks before each test
    mockKeychain.setInternetCredentials.mockClear();
    mockKeychain.getInternetCredentials.mockClear();
    mockKeychain.resetInternetCredentials.mockClear();
    mockKeychain.hasInternetCredentials.mockClear();
  });

  describe('storeTokens', () => {
    it('should export a storeTokens function', () => {
      expect(typeof storeTokens).toBe('function');
    });

    it('should store tokens securely in keychain', async () => {
      const tokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockKeychain.setInternetCredentials.mockResolvedValueOnce(true);

      const result = await storeTokens(tokens);

      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        'discbaboons_auth_tokens',
        'user',
        JSON.stringify(tokens),
        {
          accessControl: 'WhenUnlockedThisDeviceOnly',
        },
      );
      expect(result).toBe(true);
    });

    it('should handle keychain storage errors gracefully', async () => {
      const tokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockKeychain.setInternetCredentials.mockRejectedValueOnce(
        new Error('Keychain access denied'),
      );

      await expect(storeTokens(tokens)).rejects.toThrow('Failed to store tokens securely');
    });

    it('should validate tokens object structure', async () => {
      await expect(storeTokens(null)).rejects.toThrow('Tokens object is required');
      await expect(storeTokens({})).rejects.toThrow('Access token is required');
      await expect(storeTokens({ accessToken: 'token' })).rejects.toThrow('Refresh token is required');
    });
  });

  describe('getTokens', () => {
    it('should export a getTokens function', () => {
      expect(typeof getTokens).toBe('function');
    });

    it('should retrieve tokens from keychain', async () => {
      const storedTokens = {
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      };

      mockKeychain.getInternetCredentials.mockResolvedValueOnce({
        username: 'user',
        password: JSON.stringify(storedTokens),
      });

      const result = await getTokens();

      expect(mockKeychain.getInternetCredentials).toHaveBeenCalledWith('discbaboons_auth_tokens');
      expect(result).toEqual(storedTokens);
    });

    it('should return null when no tokens are stored', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValueOnce(false);

      const result = await getTokens();

      expect(result).toBeNull();
    });

    it('should handle keychain retrieval errors gracefully', async () => {
      mockKeychain.getInternetCredentials.mockRejectedValueOnce(
        new Error('Keychain access denied'),
      );

      const result = await getTokens();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockKeychain.getInternetCredentials.mockResolvedValueOnce({
        username: 'user',
        password: 'invalid-json',
      });

      const result = await getTokens();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should export a clearTokens function', () => {
      expect(typeof clearTokens).toBe('function');
    });

    it('should clear tokens from keychain', async () => {
      mockKeychain.resetInternetCredentials.mockResolvedValueOnce(true);

      const result = await clearTokens();

      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith('discbaboons_auth_tokens');
      expect(result).toBe(true);
    });

    it('should handle keychain clear errors gracefully', async () => {
      mockKeychain.resetInternetCredentials.mockRejectedValueOnce(
        new Error('Keychain access denied'),
      );

      const result = await clearTokens();

      expect(result).toBe(false);
    });
  });

  describe('hasStoredTokens', () => {
    it('should export a hasStoredTokens function', () => {
      expect(typeof hasStoredTokens).toBe('function');
    });

    it('should return true when tokens exist', async () => {
      mockKeychain.hasInternetCredentials.mockResolvedValueOnce(true);

      const result = await hasStoredTokens();

      expect(mockKeychain.hasInternetCredentials).toHaveBeenCalledWith('discbaboons_auth_tokens');
      expect(result).toBe(true);
    });

    it('should return false when no tokens exist', async () => {
      mockKeychain.hasInternetCredentials.mockResolvedValueOnce(false);

      const result = await hasStoredTokens();

      expect(result).toBe(false);
    });

    it('should handle keychain check errors gracefully', async () => {
      mockKeychain.hasInternetCredentials.mockRejectedValueOnce(
        new Error('Keychain access denied'),
      );

      const result = await hasStoredTokens();

      expect(result).toBe(false);
    });
  });
});
