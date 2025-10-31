import { render } from '@testing-library/react-native';
import OfflineIndicator from '../../src/components/OfflineIndicator';
import { ThemeProvider } from '../../src/context/ThemeContext';

// Mock useNetworkStatus hook
jest.mock('../../src/hooks/useNetworkStatus', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isOnline: true })),
}));

// Mock offline queue
jest.mock('../../src/services/offlineQueue', () => ({
  getQueueSize: jest.fn(() => Promise.resolve(0)),
}));

// Helper to render with theme
const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('OfflineIndicator', () => {
  it('should export a component', () => {
    expect(typeof OfflineIndicator).toBe('function');
  });

  it('should not render when online', () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    useNetworkStatus.mockReturnValue({ isOnline: true });

    const { queryByTestId } = renderWithTheme(<OfflineIndicator />);

    expect(queryByTestId('offline-indicator')).toBeNull();
  });

  it('should render "Offline" badge when disconnected', () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    useNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByTestId, getByText } = renderWithTheme(<OfflineIndicator />);

    expect(getByTestId('offline-indicator')).toBeTruthy();
    expect(getByText('Offline')).toBeTruthy();
  });

  it('should have accessible label', () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    useNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByTestId } = renderWithTheme(<OfflineIndicator />);

    const indicator = getByTestId('offline-indicator');
    expect(indicator.props.accessibilityLabel).toBe('Offline mode');
  });

  it('should show queue size when there are pending operations', async () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    const offlineQueue = require('../../src/services/offlineQueue');

    useNetworkStatus.mockReturnValue({ isOnline: false });
    offlineQueue.getQueueSize.mockResolvedValue(3);

    const { findByText } = renderWithTheme(<OfflineIndicator />);

    // Should show "Offline (3)"
    const queueText = await findByText('Offline (3)');
    expect(queueText).toBeTruthy();
  });

  it('should not show queue size when queue is empty', async () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    const offlineQueue = require('../../src/services/offlineQueue');

    useNetworkStatus.mockReturnValue({ isOnline: false });
    offlineQueue.getQueueSize.mockResolvedValue(0);

    const { findByText } = renderWithTheme(<OfflineIndicator />);

    // Should show just "Offline"
    const text = await findByText('Offline');
    expect(text).toBeTruthy();
  });

  it('should update queue count dynamically', async () => {
    const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
    const offlineQueue = require('../../src/services/offlineQueue');

    useNetworkStatus.mockReturnValue({ isOnline: false });
    offlineQueue.getQueueSize.mockResolvedValue(1);

    const { findByText } = renderWithTheme(<OfflineIndicator />);

    // Should show "Offline (1)"
    const text = await findByText('Offline (1)');
    expect(text).toBeTruthy();
  });
});
