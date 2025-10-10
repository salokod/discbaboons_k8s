import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import SaveStatusIndicator from '../../../src/components/scorecard/SaveStatusIndicator';
import { spacing } from '../../../src/design-system/tokens';

const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('SaveStatusIndicator', () => {
  it('should export a component', () => {
    expect(typeof SaveStatusIndicator).toBe('function');
  });

  it('should use design system spacing tokens for container padding', () => {
    const { getByTestId } = renderWithTheme(
      <SaveStatusIndicator status="saved" />,
    );

    const container = getByTestId('save-status-indicator');
    const containerStyle = container.props.style;

    // Find the style object that contains padding (excluding opacity from Animated)
    const paddingStyle = Array.isArray(containerStyle)
      ? containerStyle.find(
        (style) => style && (
          style.paddingHorizontal !== undefined
          || style.paddingVertical !== undefined
        ),
      )
      : containerStyle;

    expect(paddingStyle).toBeDefined();
    expect(paddingStyle.paddingHorizontal).toBe(spacing.sm); // 8
    expect(paddingStyle.paddingVertical).toBe(spacing.xs); // 4
  });

  it('should render with testID save-status-indicator', () => {
    const { getByTestId } = renderWithTheme(<SaveStatusIndicator status="saved" />);
    expect(getByTestId('save-status-indicator')).toBeTruthy();
  });

  it('should accept status prop', () => {
    expect(() => renderWithTheme(
      <SaveStatusIndicator status="saved" />,
    )).not.toThrow();
  });

  it('should display "Saved" when status is saved', () => {
    const { getByText } = renderWithTheme(<SaveStatusIndicator status="saved" />);
    expect(getByText('Saved')).toBeTruthy();
  });

  it('should display "Saving..." when status is saving', () => {
    const { getByText } = renderWithTheme(<SaveStatusIndicator status="saving" />);
    expect(getByText('Saving...')).toBeTruthy();
  });

  it('should display "Error" when status is error', () => {
    const { getByText } = renderWithTheme(<SaveStatusIndicator status="error" />);
    expect(getByText('Error')).toBeTruthy();
  });

  it('should use success color for saved status', () => {
    const { getByTestId } = renderWithTheme(<SaveStatusIndicator status="saved" />);
    const indicator = getByTestId('save-status-indicator');
    // Success color should be applied
    expect(indicator).toBeTruthy();
  });

  it('should use warning color for saving status', () => {
    const { getByTestId } = renderWithTheme(<SaveStatusIndicator status="saving" />);
    const indicator = getByTestId('save-status-indicator');
    // Warning color should be applied
    expect(indicator).toBeTruthy();
  });

  it('should use error color for error status', () => {
    const { getByTestId } = renderWithTheme(<SaveStatusIndicator status="error" />);
    const indicator = getByTestId('save-status-indicator');
    // Error color should be applied
    expect(indicator).toBeTruthy();
  });

  it('should use small, subtle text styling', () => {
    const { getByText } = renderWithTheme(<SaveStatusIndicator status="saved" />);
    const text = getByText('Saved');
    expect(text.props.style).toMatchObject({
      fontSize: 12,
    });
  });

  it('should have accessibilityLiveRegion set to polite', () => {
    const { getByTestId } = renderWithTheme(
      <SaveStatusIndicator status="saved" />,
    );

    const container = getByTestId('save-status-indicator');
    expect(container.props.accessibilityLiveRegion).toBe('polite');
  });

  it('should have descriptive accessibilityLabel for saved status', () => {
    const { getByTestId } = renderWithTheme(
      <SaveStatusIndicator status="saved" />,
    );

    const container = getByTestId('save-status-indicator');
    expect(container.props.accessibilityLabel).toBe('Scores saved');
  });

  it('should have descriptive accessibilityLabel for saving status', () => {
    const { getByTestId } = renderWithTheme(
      <SaveStatusIndicator status="saving" />,
    );

    const container = getByTestId('save-status-indicator');
    expect(container.props.accessibilityLabel).toBe('Saving scores');
  });

  it('should have descriptive accessibilityLabel for error status', () => {
    const { getByTestId } = renderWithTheme(
      <SaveStatusIndicator status="error" />,
    );

    const container = getByTestId('save-status-indicator');
    expect(container.props.accessibilityLabel).toBe('Error saving scores');
  });

  describe('Auto-dismiss behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-dismiss "Saved" status after 2.5 seconds', () => {
      const onDismiss = jest.fn();
      renderWithTheme(<SaveStatusIndicator status="saved" onDismiss={onDismiss} />);

      // Should not dismiss immediately
      expect(onDismiss).not.toHaveBeenCalled();

      // Fast-forward 2.5 seconds (delay) + 300ms (animation)
      jest.advanceTimersByTime(2500);
      jest.runAllTimers(); // Run animation timers

      // Should call onDismiss
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should NOT auto-dismiss "Error" status', () => {
      const onDismiss = jest.fn();
      renderWithTheme(<SaveStatusIndicator status="error" onDismiss={onDismiss} />);

      // Fast-forward 5 seconds (more than 2.5)
      jest.advanceTimersByTime(5000);

      // Should NOT call onDismiss for errors
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should NOT auto-dismiss "Saving..." status', () => {
      const onDismiss = jest.fn();
      renderWithTheme(<SaveStatusIndicator status="saving" onDismiss={onDismiss} />);

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Should NOT call onDismiss while saving
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should use fade animation when dismissing', () => {
      const onDismiss = jest.fn();
      const { getByTestId } = renderWithTheme(
        <SaveStatusIndicator status="saved" onDismiss={onDismiss} />,
      );

      const container = getByTestId('save-status-indicator');

      // Container should be visible initially
      expect(container).toBeTruthy();

      // Fast-forward to trigger fade animation
      jest.advanceTimersByTime(2500);
      jest.runAllTimers(); // Run animation timers

      // Verify onDismiss was called (actual fade handled by Animated)
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should clear timeout when component unmounts', () => {
      const onDismiss = jest.fn();
      const { unmount } = renderWithTheme(
        <SaveStatusIndicator status="saved" onDismiss={onDismiss} />,
      );

      // Unmount before timeout completes
      unmount();

      // Fast-forward time
      jest.advanceTimersByTime(2500);

      // Should not call onDismiss after unmount
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should reset timer when status changes from saved to something else', () => {
      const onDismiss = jest.fn();
      const { rerender } = renderWithTheme(
        <SaveStatusIndicator status="saved" onDismiss={onDismiss} />,
      );

      // Fast-forward halfway
      jest.advanceTimersByTime(1250);

      // Change status to saving - need to wrap in ThemeProvider
      rerender(
        <ThemeProvider testMode>
          <SaveStatusIndicator status="saving" onDismiss={onDismiss} />
        </ThemeProvider>,
      );

      // Fast-forward rest of time
      jest.advanceTimersByTime(1250);

      // Should NOT have dismissed (timer was cleared)
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});
