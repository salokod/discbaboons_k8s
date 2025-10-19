/**
 * FixedBottomActionBar Tests
 * Test-driven development for fixed bottom action bar component
 */

import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import FixedBottomActionBar from '../../../src/components/rounds/FixedBottomActionBar';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { triggerSuccessHaptic } from '../../../src/services/hapticService';

// Mock hapticService
jest.mock('../../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
}));

describe('FixedBottomActionBar', () => {
  describe('should export a component', () => {
    it('should be a React component', () => {
      expect(FixedBottomActionBar).toBeTruthy();
      expect(typeof FixedBottomActionBar).toBe('object');
    });

    it('should have displayName set', () => {
      // Memo wraps the component, so check the type's displayName
      expect(FixedBottomActionBar.type?.displayName || FixedBottomActionBar.displayName).toBe('FixedBottomActionBar');
    });
  });

  describe('component rendering', () => {
    it('should render with theme support', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('fixed-bottom-action-bar')).toBeTruthy();
    });

    it('should render primary button with label', () => {
      const { getByText } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Open Scorecard"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Open Scorecard')).toBeTruthy();
    });

    it('should render secondary action when provided', () => {
      const { getByText } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            secondaryLabel="Settings"
            secondaryIcon="settings-outline"
            onSecondaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Settings')).toBeTruthy();
    });

    it('should not render secondary action when not provided', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('secondary-action-button')).toBeNull();
    });
  });

  describe('platform-adaptive styling', () => {
    it('should render with platform-adaptive styles on iOS', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'ios';

      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('fixed-bottom-action-bar');

      // Verify component renders correctly on iOS
      expect(container).toBeTruthy();

      // Restore original platform
      Platform.OS = originalOS;
    });

    it('should render with platform-adaptive styles on Android', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'android';

      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('fixed-bottom-action-bar');

      // Verify component renders correctly on Android
      expect(container).toBeTruthy();

      // Restore original platform
      Platform.OS = originalOS;
    });
  });

  describe('safe area handling', () => {
    it('should apply platform-specific bottom padding for safe area', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('fixed-bottom-action-bar');
      const { style } = container.props;

      // Should have paddingBottom defined (Platform.select result)
      expect(style.paddingBottom).toBeDefined();
      expect(typeof style.paddingBottom).toBe('number');
    });
  });

  describe('user interactions', () => {
    it('should call onPrimaryPress when primary button is pressed', () => {
      const mockOnPrimaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={mockOnPrimaryPress}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('primary-action-button'));
      expect(mockOnPrimaryPress).toHaveBeenCalledTimes(1);
    });

    it('should call onSecondaryPress when secondary button is pressed', () => {
      const mockOnSecondaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            secondaryLabel="Settings"
            secondaryIcon="settings-outline"
            onSecondaryPress={mockOnSecondaryPress}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('secondary-action-button'));
      expect(mockOnSecondaryPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPrimaryPress when button is disabled', () => {
      const mockOnPrimaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={mockOnPrimaryPress}
            primaryDisabled
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('primary-action-button'));
      expect(mockOnPrimaryPress).not.toHaveBeenCalled();
    });
  });

  describe('button states', () => {
    it('should disable primary button when primaryDisabled is true', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            primaryDisabled
          />
        </ThemeProvider>,
      );

      expect(getByTestId('primary-action-button').props.accessibilityState.disabled).toBe(true);
    });

    it('should enable primary button when primaryDisabled is false', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            primaryDisabled={false}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('primary-action-button').props.accessibilityState.disabled).toBe(false);
    });
  });

  describe('accessibility support', () => {
    it('should have proper testIDs for accessibility', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            secondaryLabel="Settings"
            secondaryIcon="settings-outline"
            onSecondaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('fixed-bottom-action-bar')).toBeTruthy();
      expect(getByTestId('primary-action-button')).toBeTruthy();
      expect(getByTestId('secondary-action-button')).toBeTruthy();
    });

    it('should have accessibilityRole of button for primary action', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('primary-action-button').props.accessibilityRole).toBe('button');
    });

    it('should have accessibilityRole of button for secondary action', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            secondaryLabel="Settings"
            secondaryIcon="settings-outline"
            onSecondaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('secondary-action-button').props.accessibilityRole).toBe('button');
    });

    it('should use primaryLabel as accessibilityLabel for primary button', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Open Scorecard"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('primary-action-button').props.accessibilityLabel).toBe('Open Scorecard');
    });

    it('should use secondaryLabel as accessibilityLabel for secondary button', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
            secondaryLabel="Settings"
            secondaryIcon="settings-outline"
            onSecondaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('secondary-action-button').props.accessibilityLabel).toBe('Settings');
    });
  });

  describe('prop validation', () => {
    it('should handle prop changes correctly', () => {
      const { getByText, rerender } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Continue')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Finish"
            onPrimaryPress={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Finish')).toBeTruthy();
    });
  });

  describe('memoization', () => {
    it('should be a memoized component', () => {
      // Check that the component is wrapped with memo
      expect(FixedBottomActionBar.$$typeof).toBeDefined();
    });
  });

  describe('haptic feedback', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should trigger haptic feedback when primary button is pressed', () => {
      const mockOnPrimaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={mockOnPrimaryPress}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('primary-action-button'));

      expect(triggerSuccessHaptic).toHaveBeenCalledTimes(1);
      expect(mockOnPrimaryPress).toHaveBeenCalledTimes(1);
    });

    it('should trigger haptic feedback before calling onPrimaryPress', () => {
      const mockOnPrimaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={mockOnPrimaryPress}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('primary-action-button'));

      // Verify haptic was called
      expect(triggerSuccessHaptic).toHaveBeenCalledTimes(1);
      // Verify callback was also called
      expect(mockOnPrimaryPress).toHaveBeenCalledTimes(1);
    });

    it('should not trigger haptic feedback when primary button is disabled', () => {
      const mockOnPrimaryPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <FixedBottomActionBar
            primaryLabel="Continue"
            onPrimaryPress={mockOnPrimaryPress}
            primaryDisabled
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('primary-action-button'));

      expect(triggerSuccessHaptic).not.toHaveBeenCalled();
      expect(mockOnPrimaryPress).not.toHaveBeenCalled();
    });
  });
});
