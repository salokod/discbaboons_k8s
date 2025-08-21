/**
 * BagDetailScreen Navigation Fix Tests
 * Tests the fix for Add Disc navigation issue
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../src/context/BagRefreshContext';
import BagDetailScreen from '../../src/screens/bags/BagDetailScreen';

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
jest.mock('../../src/services/bagService', () => ({
  getBag: jest.fn(() => Promise.resolve({
    id: 'test-bag-id',
    name: 'Test Bag',
    bag_contents: [
      {
        id: 'disc1',
        brand: 'Test Brand',
        model: 'Test Model',
        speed: 5,
        glide: 5,
        turn: -2,
        fade: 1,
      },
    ],
  })),
  removeDiscFromBag: jest.fn(() => Promise.resolve()),
}));

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
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
jest.mock('../../src/context/BagRefreshContext', () => ({
  useBagRefreshListener: jest.fn(),
  useBagRefreshContext: jest.fn(() => ({
    triggerBagListRefresh: jest.fn(),
  })),
  BagRefreshProvider: ({ children }) => children,
}));

// Mock multi-select hook
jest.mock('../../src/hooks/useMultiSelect', () => ({
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

// Mock React Navigation hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => mockNavigation),
  useRoute: jest.fn(() => mockRoute),
}));

// Mock react-native-gesture-handler to prevent swipe errors
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: ({ children }) => children,
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

describe('BagDetailScreen Navigation Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to correct DiscSearch route when Add Disc is pressed', async () => {
    const { getByText, unmount } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagDetailScreen navigation={mockNavigation} route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    try {
      // Wait for bag data to load and find Add Disc button
      await waitFor(() => {
        expect(getByText('Add Disc')).toBeTruthy();
      }, { timeout: 5000 });

      // Find and press the Add Disc button in the header
      const addButton = getByText('Add Disc');
      fireEvent.press(addButton);

      // Verify navigation was called with correct modal navigation structure
      expect(mockNavigation.navigate).toHaveBeenCalledWith('DiscSearchScreen', {
        mode: 'addToBag',
        bagId: 'test-bag-id',
        bagName: 'Test Bag',
      });
    } finally {
      unmount();
    }
  });

  it('should NOT use the old incorrect direct navigation to DiscSearch', async () => {
    const { getByText, unmount } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagDetailScreen navigation={mockNavigation} route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    try {
      // Wait for component to load and find Add Disc button
      await waitFor(() => {
        expect(getByText('Add Disc')).toBeTruthy();
      }, { timeout: 5000 });

      // Press the button
      const addButton = getByText('Add Disc');
      fireEvent.press(addButton);

      // Verify it does NOT call the old incorrect direct navigation
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith(
        'DiscSearch',
        expect.anything(),
      );
    } finally {
      unmount();
    }
  });

  it('should pass correct parameters for cross-tab navigation', async () => {
    const { getByText, unmount } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagDetailScreen navigation={mockNavigation} route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    try {
      // Wait for component to load and find Add Disc button
      await waitFor(() => {
        expect(getByText('Add Disc')).toBeTruthy();
      }, { timeout: 5000 });

      // Press the button
      const addButton = getByText('Add Disc');
      fireEvent.press(addButton);

      // Verify all required parameters are included in modal navigation structure
      const navigationCall = mockNavigation.navigate.mock.calls[0];
      expect(navigationCall[0]).toBe('DiscSearchScreen');
      expect(navigationCall[1]).toMatchObject({
        mode: 'addToBag',
        bagId: 'test-bag-id',
        bagName: 'Test Bag',
      });
    } finally {
      unmount();
    }
  });

  it('should handle edge case when bag name is missing', async () => {
    // Mock getBag to return bag without name
    const bagService = require('../../src/services/bagService');
    bagService.getBag.mockResolvedValueOnce({
      id: 'test-bag-id',
      name: null,
      bag_contents: [],
    });

    const { getByText } = render(
      <BagDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      const addButton = getByText('Add Disc');
      fireEvent.press(addButton);
    });

    // Should fallback to 'Your Bag' when bag name is missing
    expect(mockNavigation.navigate).toHaveBeenCalledWith('DiscSearchScreen', {
      mode: 'addToBag',
      bagId: 'test-bag-id',
      bagName: 'Your Bag',
    });
  });
});
