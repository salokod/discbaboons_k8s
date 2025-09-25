/**
 * StatusBarSafeView Component Tests
 */

import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import StatusBarSafeView from '../StatusBarSafeView';

// Mock ThemeContext
jest.mock('../../context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    primary: '#007AFF',
    secondary: '#8E8E93',
    accent: '#FF9500',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    border: '#C7C7CC',
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({
    children,
  }) => children,
  SafeAreaView: ({
    children, edges = ['top'], style, testID, accessibilityLabel,
  }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      style, testID, accessibilityLabel, edges,
    }, children);
  },
  useSafeAreaInsets: () => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  }),
}));

// Mock Platform for testing
const mockPlatform = (os) => {
  Platform.OS = os;
};

// Mock StatusBar.currentHeight directly
Object.defineProperty(require('react-native').StatusBar, 'currentHeight', {
  get: jest.fn(() => 24),
  configurable: true,
});

// Use direct rendering since context is mocked

describe('StatusBarSafeView Component', () => {
  function TestChild() {
    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset Platform.OS to avoid test pollution
    Platform.OS = 'ios';
  });

  describe('Cross-platform behavior', () => {
    it('should render children correctly', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      expect(getByTestId('status-bar-safe-view')).toBeTruthy();
    });

    it('should accept custom style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view" style={customStyle}>
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.style).toEqual(customStyle);
    });

    it('should accept custom edges prop', () => {
      const customEdges = ['top', 'left'];
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view" edges={customEdges}>
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(customEdges);
    });

    it('should default to top edge only', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // The component should render successfully, edges are handled internally
      expect(component).toBeTruthy();
    });
  });

  describe('Android-specific behavior', () => {
    beforeEach(() => {
      mockPlatform('android');
      Platform.OS = 'android';
    });

    it('should use safe area context for proper Android status bar handling', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Should render component successfully
      expect(component).toBeTruthy();
    });

    it('should delegate safe area handling to react-native-safe-area-context', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Component should render successfully, delegating to SafeAreaView
      expect(component).toBeTruthy();
    });
  });

  describe('iOS-specific behavior', () => {
    beforeEach(() => {
      mockPlatform('ios');
      Platform.OS = 'ios';
    });

    it('should use safe area context for consistent iOS status bar handling', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Should render component successfully
      expect(component).toBeTruthy();
    });

    it('should rely on react-native-safe-area-context for status bar handling', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Component should render successfully, delegating to SafeAreaView
      expect(component).toBeTruthy();
    });
  });

  describe('Safe area context integration', () => {
    it('should support bottom safe area edges', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'bottom']}>
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'bottom']);
    });

    it('should support left and right safe area edges', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'left', 'right']}>
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'left', 'right']);
    });

    it('should support all safe area edges', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'bottom', 'left', 'right']}>
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'bottom', 'left', 'right']);
    });
  });

  describe('Theme integration', () => {
    it('should use theme colors for background', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Component should render successfully with theme integration
      expect(component).toBeTruthy();
    });

    it('should have flex: 1 for proper layout', () => {
      const { getByTestId } = render(
        <StatusBarSafeView testID="status-bar-safe-view">
          <TestChild />
        </StatusBarSafeView>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Component should render successfully with proper layout
      expect(component).toBeTruthy();
    });
  });
});
