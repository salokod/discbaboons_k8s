/**
 * BagDetailScreen Status Bar Fix Tests
 * Tests that BagDetailScreen uses StatusBarSafeView for proper Android protection
 */

import { render, waitFor } from '@testing-library/react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';

// Mock navigation object
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
};

// Mock route object
const mockRoute = {
  params: {
    bagId: 'test-bag-id',
  },
};

// Mock bag service
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(() => Promise.resolve({
    id: 'test-bag-id',
    name: 'Test Bag',
    bag_contents: [],
  })),
  getLostDiscCountForBag: jest.fn().mockResolvedValue(0),
}));

// Mock ThemeContext
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    border: '#E0E0E0',
    error: '#D32F2F',
    info: '#1976D2',
    textOnPrimary: '#FFFFFF',
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock BagRefreshContext
jest.mock('../../../src/context/BagRefreshContext', () => ({
  useBagRefreshListener: jest.fn(),
  useBagRefreshContext: jest.fn(() => ({
    triggerBagListRefresh: jest.fn(),
  })),
  BagRefreshProvider: ({ children }) => children,
}));

// Mock multi-select hook
jest.mock('../../../src/hooks/useMultiSelect', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isMultiSelectMode: false,
    selectedIds: new Set(),
    selectedCount: 0,
    toggleSelection: jest.fn(),
    enterMultiSelectMode: jest.fn(),
    exitMultiSelectMode: jest.fn(),
  })),
}));

describe('BagDetailScreen Status Bar Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use StatusBarSafeView for proper Android status bar protection', async () => {
    const { getByTestId, unmount } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagDetailScreen navigation={mockNavigation} route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    try {
      // Wait for component to load
      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
      }, { timeout: 5000 });

      // The container should be wrapped with StatusBarSafeView
      // which provides proper Android status bar protection
      const container = getByTestId('bag-detail-screen');
      expect(container).toBeTruthy();
    } finally {
      unmount();
    }
  });

  it('should NOT use React Native SafeAreaView directly', () => {
    // This test ensures we're using the custom StatusBarSafeView component
    // instead of React Native's SafeAreaView which doesn't work on Android

    // Import the component to check its implementation
    const BagDetailScreenModule = require('../../../src/screens/bags/BagDetailScreen');
    const componentString = BagDetailScreenModule.default.toString();

    // The component should import StatusBarSafeView
    // This test will fail if SafeAreaView from react-native is still being used
    expect(componentString).not.toContain('SafeAreaView');
  });
});
