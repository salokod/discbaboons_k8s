/**
 * Tests for SwipeableDiscRow Component
 * Following TDD methodology
 */

import { render, fireEvent } from '@testing-library/react-native';
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
    error: '#FF3B30',
    info: '#007AFF',
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

// Mock React Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
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

const mockBagId = 'test-bag-1';
const mockBagName = 'Test Bag';

const renderComponent = (component) => render(component);

describe('SwipeableDiscRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        <SwipeableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
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
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.renderRightActions).toBeDefined();
      expect(typeof swipeableProps.renderRightActions).toBe('function');
    });

    it('should set 40px threshold for swipe detection', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.rightThreshold).toBe(40);
    });

    it('should trigger onSwipeRight callback when swipe is opened', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeRight = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
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
      const mockOnSwipeRight = jest.fn().mockReturnValue([
        { id: 'edit', label: 'Edit', onPress: jest.fn() },
        { id: 'delete', label: 'Delete', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
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
      <SwipeableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    expect(getByTestId('disc-row')).toBeTruthy();
  });

  it('should wrap DiscRow in container component', () => {
    const { getByTestId } = renderComponent(
      <SwipeableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    expect(getByTestId('swipeable-disc-row')).toBeTruthy();
    expect(getByTestId('disc-row')).toBeTruthy();
  });

  it('should accept onSwipeRight prop', () => {
    const mockOnSwipeRight = jest.fn();

    expect(() => {
      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );
    }).not.toThrow();
  });

  it('should accept onSwipeLeft prop', () => {
    const mockOnSwipeLeft = jest.fn();

    expect(() => {
      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );
    }).not.toThrow();
  });

  it('should not render right actions when onSwipeRight is not provided', () => {
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    expect(queryByTestId('right-actions')).toBeNull();
  });

  it('should not use animation hooks in simple implementation', () => {
    const { useSharedValue, useAnimatedStyle } = require('react-native-reanimated');

    renderComponent(
      <SwipeableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
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
      <SwipeableDiscRow
        disc={mockDisc}
        onSwipeRight={mockOnSwipeRight}
        actions={mockActions}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    // In simple implementation, no action menu is rendered yet
    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });

  it('should not render SwipeActionMenu when actions array is empty', () => {
    const mockOnSwipeRight = jest.fn();
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow
        disc={mockDisc}
        onSwipeRight={mockOnSwipeRight}
        actions={[]}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });

  it('should not render SwipeActionMenu when actions is undefined', () => {
    const mockOnSwipeRight = jest.fn();
    const { queryByTestId } = renderComponent(
      <SwipeableDiscRow
        disc={mockDisc}
        onSwipeRight={mockOnSwipeRight}
        bagId={mockBagId}
        bagName={mockBagName}
      />,
    );

    expect(queryByTestId('swipe-action-menu')).toBeNull();
  });

  describe('Theme System Integration', () => {
    it('should use theme colors instead of hardcoded colors for Edit button', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue([
        { id: 'edit', label: 'Edit', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const editButton = getByTestId('edit-button');

      // Should use colors.primary (#ec7032) instead of hardcoded #007AFF
      expect(editButton.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#ec7032', // colors.primary from theme mock
        }),
      );
    });

    it('should use theme colors instead of hardcoded colors for Remove button', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue([
        { id: 'delete', label: 'Delete', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const removeButton = getByTestId('remove-button');

      // Should use colors.error instead of hardcoded #FF3B30
      expect(removeButton.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#FF3B30', // colors.error from theme mock
        }),
      );
    });

    it('should use theme colors for Move button on left swipe', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeLeft = jest.fn().mockReturnValue([
        { id: 'move', label: 'Move', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render left actions
      const MockSwipeable = jest.fn(({ children, renderLeftActions }) => {
        const leftActions = renderLeftActions ? renderLeftActions() : null;
        return React.createElement(View, null, leftActions, children);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const moveButton = getByTestId('move-button');

      // Should use colors.info instead of hardcoded #007AFF
      expect(moveButton.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#007AFF', // colors.info from theme mock
        }),
      );
    });
  });

  describe('Left Swipe Infrastructure', () => {
    it('should provide renderLeftActions to Swipeable when onSwipeLeft is provided', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeLeft = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.renderLeftActions).toBeDefined();
      expect(typeof swipeableProps.renderLeftActions).toBe('function');
    });

    it('should not provide renderLeftActions when onSwipeLeft is not provided', () => {
      const { Swipeable } = require('react-native-gesture-handler');

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.renderLeftActions).toBeUndefined();
    });

    it('should render left actions when onSwipeLeft is provided and returns Move action', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeLeft = jest.fn().mockReturnValue([
        { id: 'move', label: 'Move', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render left actions
      const MockSwipeable = jest.fn(({ children, renderLeftActions }) => {
        const leftActions = renderLeftActions ? renderLeftActions() : null;
        return React.createElement(View, null, leftActions, children);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      expect(getByTestId('left-actions')).toBeTruthy();
      expect(getByTestId('move-button')).toBeTruthy();
    });

    it('should set 40px threshold for left swipe detection', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeLeft = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.leftThreshold).toBe(40);
    });

    it('should trigger onSwipeLeft callback when left swipe is opened', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const mockOnSwipeLeft = jest.fn();

      // Mock Swipeable to capture props
      const MockSwipeable = jest.fn(({ children }) => children);
      Swipeable.mockImplementation(MockSwipeable);

      renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeLeft={mockOnSwipeLeft}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const swipeableCall = MockSwipeable.mock.calls[0];
      const swipeableProps = swipeableCall[0];

      expect(swipeableProps.onSwipeableOpen).toBeDefined();
      expect(typeof swipeableProps.onSwipeableOpen).toBe('function');

      // Simulate swipe open with 'left' direction
      swipeableProps.onSwipeableOpen('left');

      expect(mockOnSwipeLeft).toHaveBeenCalledWith(mockDisc);
    });
  });

  describe('Right Swipe Simplification', () => {
    it('should render only Edit and Remove buttons on right swipe (no Move)', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue([
        { id: 'edit', label: 'Edit', onPress: jest.fn() },
        { id: 'move', label: 'Move', onPress: jest.fn() }, // Include move but it should be filtered out
        { id: 'delete', label: 'Delete', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId, queryByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      // Should render Edit and Remove buttons
      expect(getByTestId('edit-button')).toBeTruthy();
      expect(getByTestId('remove-button')).toBeTruthy();

      // Should NOT render Move button on right swipe (even if provided in actions)
      expect(queryByTestId('move-button')).toBeNull();
    });

    it('should show 2-button layout for right swipe (Edit + Remove)', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue([
        { id: 'edit', label: 'Edit', onPress: jest.fn() },
        { id: 'move', label: 'Move', onPress: jest.fn() },
        { id: 'delete', label: 'Delete', onPress: jest.fn() },
      ]);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const rightActions = getByTestId('right-actions');
      const buttons = rightActions.children;

      // Should only have 2 buttons (Edit + Remove, no Move)
      expect(buttons).toHaveLength(2);
      expect(getByTestId('edit-button')).toBeTruthy();
      expect(getByTestId('remove-button')).toBeTruthy();
    });
  });

  describe('Dual-Action Swipe UI', () => {
    const mockActions = [
      {
        id: 'edit',
        label: 'Edit',
        color: '#007AFF',
        icon: 'create-outline',
        onPress: jest.fn(),
      },
      {
        id: 'delete',
        label: 'Delete',
        color: '#FF3B30',
        icon: 'trash-outline',
        onPress: jest.fn(),
      },
    ];

    const mockActionsWithMove = [
      {
        id: 'edit',
        label: 'Edit',
        color: '#007AFF',
        icon: 'create-outline',
        onPress: jest.fn(),
      },
      {
        id: 'move',
        label: 'Move',
        color: '#007AFF',
        icon: 'swap-horizontal-outline',
        onPress: jest.fn(),
      },
      {
        id: 'delete',
        label: 'Delete',
        color: '#FF3B30',
        icon: 'trash-outline',
        onPress: jest.fn(),
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render both Edit and Remove buttons when swiped', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue(mockActions);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      expect(getByTestId('edit-button')).toBeTruthy();
      expect(getByTestId('remove-button')).toBeTruthy();
    });

    it('should apply correct theme colors to each button', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue(mockActions);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const editButton = getByTestId('edit-button');
      const removeButton = getByTestId('remove-button');

      // Check that buttons have correct theme colors
      expect(editButton.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#ec7032', // colors.primary from theme
        }),
      );
      expect(removeButton.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#FF3B30', // colors.error from theme
        }),
      );
    });

    it('should navigate to EditDiscScreen when Edit button is pressed', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue(mockActions);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const editButton = getByTestId('edit-button');

      // Simulate press
      fireEvent.press(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('EditDiscScreen', {
        disc: mockDisc,
        bagId: mockBagId,
        bagName: mockBagName,
      });
    });

    it('should trigger correct action when Remove button is pressed', () => {
      const { Swipeable } = require('react-native-gesture-handler');
      const React = require('react');
      const { View } = require('react-native');
      const mockOnSwipeRight = jest.fn().mockReturnValue(mockActions);

      // Mock Swipeable to capture and render right actions
      const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
        const rightActions = renderRightActions ? renderRightActions() : null;
        return React.createElement(View, null, children, rightActions);
      });
      Swipeable.mockImplementation(MockSwipeable);

      const { getByTestId } = renderComponent(
        <SwipeableDiscRow
          disc={mockDisc}
          onSwipeRight={mockOnSwipeRight}
          bagId={mockBagId}
          bagName={mockBagName}
        />,
      );

      const removeButton = getByTestId('remove-button');

      // Simulate press
      fireEvent.press(removeButton);

      expect(mockActions[1].onPress).toHaveBeenCalled();
    });

    describe('Move Action', () => {
      it('should NOT render Move button on right swipe even when move action is provided', () => {
        const { Swipeable } = require('react-native-gesture-handler');
        const React = require('react');
        const { View } = require('react-native');
        const mockOnSwipeRight = jest.fn().mockReturnValue(mockActionsWithMove);

        // Mock Swipeable to capture and render right actions
        const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
          const rightActions = renderRightActions ? renderRightActions() : null;
          return React.createElement(View, null, children, rightActions);
        });
        Swipeable.mockImplementation(MockSwipeable);

        const { getByTestId, queryByTestId } = renderComponent(
          <SwipeableDiscRow
            disc={mockDisc}
            onSwipeRight={mockOnSwipeRight}
            bagId={mockBagId}
            bagName={mockBagName}
          />,
        );

        expect(getByTestId('edit-button')).toBeTruthy();
        expect(queryByTestId('move-button')).toBeNull(); // Move should NOT be on right swipe
        expect(getByTestId('remove-button')).toBeTruthy();
      });

      it('should render Move button on left swipe when move action is provided', () => {
        const { Swipeable } = require('react-native-gesture-handler');
        const React = require('react');
        const { View } = require('react-native');
        const mockOnSwipeLeft = jest.fn().mockReturnValue([
          { id: 'move', label: 'Move', onPress: jest.fn() },
        ]);

        // Mock Swipeable to capture and render left actions
        const MockSwipeable = jest.fn(({ children, renderLeftActions }) => {
          const leftActions = renderLeftActions ? renderLeftActions() : null;
          return React.createElement(View, null, leftActions, children);
        });
        Swipeable.mockImplementation(MockSwipeable);

        const { getByTestId } = renderComponent(
          <SwipeableDiscRow
            disc={mockDisc}
            onSwipeLeft={mockOnSwipeLeft}
            bagId={mockBagId}
            bagName={mockBagName}
          />,
        );

        const moveButton = getByTestId('move-button');
        expect(moveButton).toBeTruthy();

        // In the actual implementation, this uses swap-horizontal-outline icon
        // The icon component is mocked in tests, so we verify the button exists
      });

      it('should use correct theme color for Move button on left swipe', () => {
        const { Swipeable } = require('react-native-gesture-handler');
        const React = require('react');
        const { View } = require('react-native');
        const mockOnSwipeLeft = jest.fn().mockReturnValue([
          { id: 'move', label: 'Move', onPress: jest.fn() },
        ]);

        // Mock Swipeable to capture and render left actions
        const MockSwipeable = jest.fn(({ children, renderLeftActions }) => {
          const leftActions = renderLeftActions ? renderLeftActions() : null;
          return React.createElement(View, null, leftActions, children);
        });
        Swipeable.mockImplementation(MockSwipeable);

        const { getByTestId } = renderComponent(
          <SwipeableDiscRow
            disc={mockDisc}
            onSwipeLeft={mockOnSwipeLeft}
            bagId={mockBagId}
            bagName={mockBagName}
          />,
        );

        const moveButton = getByTestId('move-button');
        expect(moveButton.props.style).toEqual(
          expect.objectContaining({
            backgroundColor: '#007AFF', // colors.info from theme
          }),
        );
      });

      it('should call move action onPress when Move button is pressed on left swipe', () => {
        const { Swipeable } = require('react-native-gesture-handler');
        const React = require('react');
        const { View } = require('react-native');
        const mockMoveAction = { id: 'move', label: 'Move', onPress: jest.fn() };
        const mockOnSwipeLeft = jest.fn().mockReturnValue([mockMoveAction]);

        // Mock Swipeable to capture and render left actions
        const MockSwipeable = jest.fn(({ children, renderLeftActions }) => {
          const leftActions = renderLeftActions ? renderLeftActions() : null;
          return React.createElement(View, null, leftActions, children);
        });
        Swipeable.mockImplementation(MockSwipeable);

        const { getByTestId } = renderComponent(
          <SwipeableDiscRow
            disc={mockDisc}
            onSwipeLeft={mockOnSwipeLeft}
            bagId={mockBagId}
            bagName={mockBagName}
          />,
        );

        const moveButton = getByTestId('move-button');

        // Simulate press
        fireEvent.press(moveButton);

        expect(mockMoveAction.onPress).toHaveBeenCalled();
      });

      it('should not render Move button when move action is not provided', () => {
        const { Swipeable } = require('react-native-gesture-handler');
        const React = require('react');
        const { View } = require('react-native');
        const mockOnSwipeRight = jest.fn().mockReturnValue(mockActions); // without move action

        // Mock Swipeable to capture and render right actions
        const MockSwipeable = jest.fn(({ children, renderRightActions }) => {
          const rightActions = renderRightActions ? renderRightActions() : null;
          return React.createElement(View, null, children, rightActions);
        });
        Swipeable.mockImplementation(MockSwipeable);

        const { queryByTestId } = renderComponent(
          <SwipeableDiscRow
            disc={mockDisc}
            onSwipeRight={mockOnSwipeRight}
            bagId={mockBagId}
            bagName={mockBagName}
          />,
        );

        expect(queryByTestId('move-button')).toBeNull();
      });
    });
  });
});
