/**
 * Tests for SwipeableDiscRow Component
 * Following TDD methodology
 */

import { render } from '@testing-library/react-native';
import SwipeableDiscRow from '../../../src/components/bags/SwipeableDiscRow';

// Mock all theme-related services first
jest.mock('../../../src/services/themeStorage', () => ({
  storeTheme: jest.fn().mockResolvedValue(true),
  getStoredTheme: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../src/services/systemTheme', () => ({
  getSystemColorScheme: jest.fn().mockReturnValue('light'),
  addSystemThemeChangeListener: jest.fn().mockReturnValue(() => {}),
  isSystemThemeSupported: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../src/utils/themeResolver', () => ({
  resolveTheme: jest.fn((theme) => (theme === 'system' ? 'light' : theme)),
}));

jest.mock('../../../src/utils/validation', () => ({
  validateAndNormalizeHexColor: jest.fn((color) => (color && color.startsWith('#') ? color : null)),
}));

// Mock theme context
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    border: '#E0E0E0',
    primary: '#ec7032',
    textOnPrimary: '#FFFFFF',
  })),
  useTheme: jest.fn(() => ({
    theme: 'light',
    activeTheme: 'light',
    isLoading: false,
  })),
}));

// Mock the DiscRow component
jest.mock('../../../src/components/bags/DiscRow', () => {
  const ReactMock = require('react');
  const { Text } = require('react-native');
  function MockDiscRow({ disc }) {
    return ReactMock.createElement(Text, { testID: 'disc-row' }, disc.model);
  }
  MockDiscRow.displayName = 'DiscRow';
  return { __esModule: true, default: MockDiscRow };
});

// Mock the SwipeActionMenu component
jest.mock('../../../src/components/bags/SwipeActionMenu', () => {
  const ReactMock = require('react');
  const { View, Text } = require('react-native');
  function MockSwipeActionMenu({ actions }) {
    return ReactMock.createElement(
      View,
      { testID: 'swipe-action-menu' },
      actions.map((action) => ReactMock.createElement(
        Text,
        { key: action.id, testID: `action-${action.id}` },
        action.label,
      )),
    );
  }
  MockSwipeActionMenu.displayName = 'SwipeActionMenu';
  return { __esModule: true, default: MockSwipeActionMenu };
});

// Mock react-native-gesture-handler (not used in simple implementation but keep for future)
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: jest.fn(),
}));

// Mock react-native-reanimated (not used in simple implementation but keep for future)
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  default: {
    View: jest.fn(),
  },
}));

// Mock Appearance API for theme context
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock design system components
jest.mock('../../../src/design-system/components/Card', () => {
  const ReactMock = require('react');
  const { View } = require('react-native');
  function MockCard({ children }) {
    return ReactMock.createElement(View, { testID: 'card' }, children);
  }
  MockCard.displayName = 'Card';
  return { __esModule: true, default: MockCard };
});

jest.mock('../../../src/design-system/components/ColorIndicator', () => {
  const ReactMock = require('react');
  const { View } = require('react-native');
  function MockColorIndicator({ testID }) {
    return ReactMock.createElement(View, { testID: testID || 'color-indicator' });
  }
  MockColorIndicator.displayName = 'ColorIndicator';
  return { __esModule: true, default: MockColorIndicator };
});

jest.mock('../../../src/components/bags/FlightPathVisualization', () => {
  const ReactMock = require('react');
  const { View } = require('react-native');
  function MockFlightPathVisualization() {
    return ReactMock.createElement(View, { testID: 'flight-path-visualization' });
  }
  MockFlightPathVisualization.displayName = 'FlightPathVisualization';
  return { __esModule: true, default: MockFlightPathVisualization };
});

jest.mock('../../../src/design-system/typography', () => ({
  typography: {
    h3: {},
    body2: {},
    captionSmall: {},
    caption: {},
    body: {},
  },
}));

jest.mock('../../../src/design-system/spacing', () => ({
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
  },
}));

// Test data
const mockDisc = {
  id: 'test-disc-1',
  model: 'Destroyer',
  brand: 'Innova',
  speed: 12,
  glide: 5,
  turn: -1,
  fade: 3,
};

const renderComponent = (component) => render(component);

describe('SwipeableDiscRow', () => {
  it('should export a component', () => {
    expect(SwipeableDiscRow).toBeDefined();
    expect(typeof SwipeableDiscRow).toBe('object'); // React.memo returns an object
  });

  it('should import Swipeable from react-native-gesture-handler', () => {
    // Test that the component imports Swipeable
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../../../src/components/bags/SwipeableDiscRow.js');
    const componentCode = fs.readFileSync(componentPath, 'utf8');

    expect(componentCode).toMatch(/import.*Swipeable.*from.*react-native-gesture-handler/);
  });

  describe('Swipeable Integration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should wrap DiscRow with Swipeable component', () => {
      const { Swipeable } = require('react-native-gesture-handler');

      // Mock Swipeable to track if it's being used
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow disc={mockDisc} />,
      );

      expect(MockSwipeable).toHaveBeenCalled();
    });

    it('should provide renderRightActions to Swipeable when onSwipeRight is provided', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.renderRightActions).toBeDefined();
      expect(typeof swipeableProps.renderRightActions).toBe('function');
    });

    it('should set 80px threshold for swipe detection', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.rightThreshold).toBe(80);
    });

    it('should trigger onSwipeRight callback when swipe is opened', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.onSwipeableOpen).toBeDefined();
      expect(typeof swipeableProps.onSwipeableOpen).toBe('function');

      // Simulate swipe open with 'right' direction
      swipeableProps.onSwipeableOpen('right');

      expect(mockOnSwipeRight).toHaveBeenCalledWith(mockDisc);
    });

    it('should forward ref to Swipeable component', () => {
      // Test that the component uses forwardRef pattern
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(__dirname, '../../../src/components/bags/SwipeableDiscRow.js');
      const componentCode = fs.readFileSync(componentPath, 'utf8');

      expect(componentCode).toMatch(/React\.forwardRef/);
      expect(componentCode).toMatch(/ref={ref}/);
    });

    it('should render right actions when onSwipeRight is provided', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
      );

      expect(getByTestId('right-actions')).toBeTruthy();
    });
  });

  it('should be wrapped with React.memo for performance optimization', () => {
    // Test that the component is memoized
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../../../src/components/bags/SwipeableDiscRow.js');
    const componentCode = fs.readFileSync(componentPath, 'utf8');

    expect(componentCode).toMatch(/React\.memo/);
  });

  it('should render DiscRow component', () => {
    const { getByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} />,
    );

    expect(getByTestId('disc-row')).toBeTruthy();
  });

  it('should wrap DiscRow in container component', () => {
    const { getByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} />,
    );

    expect(getByTestId('swipeable-disc-row')).toBeTruthy();
    expect(getByTestId('disc-row')).toBeTruthy();
  });

  it('should accept onSwipeRight prop', () => {
    const mockOnSwipeRight = jest.fn();

    expect(() => {
      renderComponent(
        <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
      );
    }).not.toThrow();
  });

  it('should not render right actions when onSwipeRight is not provided', () => {
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} />,
    );

    expect(queryByTestId('right-actions')).toBeNull();
  });

  it('should not use animation hooks in simple implementation', () => {
    const { useSharedValue, useAnimatedStyle } = require('react-native-reanimated');

    renderComponent(
      <SwipeableDiscRow disc={mockDisc} />,
    );

    // In simple implementation, no animation hooks are used yet
    expect(useSharedValue).not.toHaveBeenCalled();
    expect(useAnimatedStyle).not.toHaveBeenCalled();
  });

  it('should not render SwipeActionMenu in simple implementation', () => {
    const mockActions = [
      { id: 'edit', label: 'Edit', color: '#007AFF' },
      { id: 'delete', label: 'Delete', color: '#FF3B30' },
    ];
    const mockOnSwipeRight = jest.fn();

    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} actions={mockActions} />,
    );

    // In simple implementation, no action menu is rendered yet
    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });

  it('should not render SwipeActionMenu when actions array is empty', () => {
    const mockOnSwipeRight = jest.fn();
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} actions={[]} />,
    );

    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });

  it('should not render SwipeActionMenu when actions is undefined', () => {
    const mockOnSwipeRight = jest.fn();
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow disc={mockDisc} onSwipeRight={mockOnSwipeRight} />,
    );

    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });
});
