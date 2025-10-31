/**
 * useNetworkStatus Hook Tests
 * Test-driven development for network status monitoring
 */

import { renderHook, act } from '@testing-library/react-native';
import useNetworkStatus from '../../src/hooks/useNetworkStatus';
import * as networkService from '../../src/services/networkService';

// Mock the network service
jest.mock('../../src/services/networkService');

describe('useNetworkStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isOnline boolean', async () => {
    networkService.isConnected.mockResolvedValue(true);
    networkService.addEventListener.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(typeof result.current.isOnline).toBe('boolean');
  });

  it('should initialize as online by default', async () => {
    networkService.isConnected.mockResolvedValue(true);
    networkService.addEventListener.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    // Initial state before network check
    expect(result.current.isOnline).toBe(true);
  });

  it('should clean up listener on unmount', () => {
    const mockUnsubscribe = jest.fn();
    networkService.isConnected.mockResolvedValue(true);
    networkService.addEventListener.mockReturnValue(mockUnsubscribe);
    networkService.removeEventListener.mockImplementation((fn) => fn());

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(networkService.removeEventListener).toHaveBeenCalledWith(mockUnsubscribe);
  });
});
