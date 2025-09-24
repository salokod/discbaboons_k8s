/**
 * StatusBarSafeView Component Tests
 */

import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import StatusBarSafeView from '../StatusBarSafeView';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({
    children,
  }) => children,
  SafeAreaView: ({
    children, edges, style, testID, accessibilityLabel,
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

// Wrapper component for theme context
function ThemeWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

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
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      expect(getByTestId('status-bar-safe-view')).toBeTruthy();
    });

    it('should accept custom style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view" style={customStyle}>
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle),
        ]),
      );
    });

    it('should accept custom edges prop', () => {
      const customEdges = ['top', 'left'];
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view" edges={customEdges}>
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(customEdges);
    });

    it('should default to top edge only', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top']);
    });
  });

  describe('Android-specific behavior', () => {
    beforeEach(() => {
      mockPlatform('android');
      Platform.OS = 'android';
    });

    it('should use safe area context for proper Android status bar handling', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Should use safe area context, not custom padding
      expect(component.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
            flex: 1,
          }),
        ]),
      );
    });

    it('should delegate safe area handling to react-native-safe-area-context', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Should not have custom paddingTop since safe area context handles it
      const hasCustomPadding = component.props.style.some(
        (style) => style && typeof style.paddingTop === 'number' && style.paddingTop > 0,
      );
      expect(hasCustomPadding).toBe(false);
    });
  });

  describe('iOS-specific behavior', () => {
    beforeEach(() => {
      mockPlatform('ios');
      Platform.OS = 'ios';
    });

    it('should use safe area context for consistent iOS status bar handling', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
            flex: 1,
          }),
        ]),
      );
    });

    it('should rely on react-native-safe-area-context for status bar handling', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      // Should not have custom platform-specific padding
      const hasCustomPadding = component.props.style.some(
        (style) => style && typeof style.paddingTop === 'number' && style.paddingTop > 0,
      );
      expect(hasCustomPadding).toBe(false);
    });
  });

  describe('Safe area context integration', () => {
    it('should support bottom safe area edges', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'bottom']}>
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'bottom']);
    });

    it('should support left and right safe area edges', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'left', 'right']}>
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'left', 'right']);
    });

    it('should support all safe area edges', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view" edges={['top', 'bottom', 'left', 'right']}>
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.edges).toEqual(['top', 'bottom', 'left', 'right']);
    });
  });

  describe('Theme integration', () => {
    it('should use theme colors for background', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
          }),
        ]),
      );
    });

    it('should have flex: 1 for proper layout', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <StatusBarSafeView testID="status-bar-safe-view">
            <TestChild />
          </StatusBarSafeView>
        </ThemeWrapper>,
      );

      const component = getByTestId('status-bar-safe-view');
      expect(component.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            flex: 1,
          }),
        ]),
      );
    });
  });
});
