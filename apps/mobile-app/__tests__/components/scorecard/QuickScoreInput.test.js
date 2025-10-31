import { render, fireEvent } from '@testing-library/react-native';
import QuickScoreInput from '../../../src/components/scorecard/QuickScoreInput';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Test wrapper component
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

const renderWithTheme = (component) => render(<TestWrapper>{component}</TestWrapper>);

describe('QuickScoreInput', () => {
  it('should export a component', () => {
    expect(typeof QuickScoreInput).toBe('function');
  });

  it('should render with testID quick-score-input', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    expect(getByTestId('quick-score-input')).toBeOnTheScreen();
  });

  it('should accept score, onIncrement, and onDecrement props', () => {
    const mockIncrement = jest.fn();
    const mockDecrement = jest.fn();

    expect(() => renderWithTheme(
      <QuickScoreInput
        score={3}
        onIncrement={mockIncrement}
        onDecrement={mockDecrement}
      />,
    )).not.toThrow();
  });

  it('should render minus button with testID', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    expect(getByTestId('quick-score-minus')).toBeOnTheScreen();
  });

  it('should render plus button with testID', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    expect(getByTestId('quick-score-plus')).toBeOnTheScreen();
  });

  it('should render score display with testID', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    expect(getByTestId('quick-score-display')).toBeOnTheScreen();
  });

  it('should display null score as dash', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput score={null} />);
    const display = getByTestId('quick-score-display');
    expect(display.props.children).toBe('—');
  });

  it('should display numeric score correctly', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput score={3} />);
    const display = getByTestId('quick-score-display');
    expect(display.props.children).toBe('3');
  });

  it('should have 48pt touch targets for accessibility (upgraded from 44pt)', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    const minusButton = getByTestId('quick-score-minus');
    const plusButton = getByTestId('quick-score-plus');

    // Pressable wraps Animated.View, so check the first child
    const minusAnimatedView = minusButton.children[0];
    const plusAnimatedView = plusButton.children[0];

    const minusStyle = minusAnimatedView.props.style.find((s) => s.width);
    const plusStyle = plusAnimatedView.props.style.find((s) => s.width);

    expect(minusStyle.width).toBe(56);
    expect(minusStyle.height).toBe(56);
    expect(plusStyle.width).toBe(56);
    expect(plusStyle.height).toBe(56);
  });

  it('should use borderRadius 12 (rounded square, not circular)', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    const minusButton = getByTestId('quick-score-minus');
    const plusButton = getByTestId('quick-score-plus');

    // Pressable wraps Animated.View, so check the first child
    const minusAnimatedView = minusButton.children[0];
    const plusAnimatedView = plusButton.children[0];

    const minusStyle = minusAnimatedView.props.style.find((s) => s.borderRadius);
    const plusStyle = plusAnimatedView.props.style.find((s) => s.borderRadius);

    expect(minusStyle.borderRadius).toBe(12);
    expect(plusStyle.borderRadius).toBe(12);
  });

  it('should have shadow elevation', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    const minusButton = getByTestId('quick-score-minus');
    const plusButton = getByTestId('quick-score-plus');

    // Pressable wraps Animated.View, so check the first child
    const minusAnimatedView = minusButton.children[0];
    const plusAnimatedView = plusButton.children[0];

    const minusStyle = minusAnimatedView.props.style.find((s) => s.elevation);
    const plusStyle = plusAnimatedView.props.style.find((s) => s.elevation);

    // Check for shadow properties (elevation: 2)
    expect(minusStyle.elevation).toBe(2);
    expect(minusStyle.shadowColor).toBe('#000');
    expect(minusStyle.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(minusStyle.shadowOpacity).toBe(0.2);
    expect(minusStyle.shadowRadius).toBe(1.41);

    expect(plusStyle.elevation).toBe(2);
    expect(plusStyle.shadowColor).toBe('#000');
    expect(plusStyle.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(plusStyle.shadowOpacity).toBe(0.2);
    expect(plusStyle.shadowRadius).toBe(1.41);
  });

  it('should use Pressable instead of TouchableOpacity', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput />);
    const minusButton = getByTestId('quick-score-minus');
    const plusButton = getByTestId('quick-score-plus');

    // Pressable sets accessibilityRole to button
    expect(minusButton.props.accessibilityRole).toBe('button');
    expect(plusButton.props.accessibilityRole).toBe('button');
  });

  it('should call onIncrement when plus button is pressed', () => {
    const mockIncrement = jest.fn();
    const { getByTestId } = renderWithTheme(
      <QuickScoreInput score={3} onIncrement={mockIncrement} />,
    );

    fireEvent.press(getByTestId('quick-score-plus'));
    expect(mockIncrement).toHaveBeenCalledTimes(1);
  });

  it('should call onDecrement when minus button is pressed', () => {
    const mockDecrement = jest.fn();
    const { getByTestId } = renderWithTheme(
      <QuickScoreInput score={3} onDecrement={mockDecrement} />,
    );

    fireEvent.press(getByTestId('quick-score-minus'));
    expect(mockDecrement).toHaveBeenCalledTimes(1);
  });

  it('should not call onIncrement if callback not provided', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput score={3} />);

    // Should not crash
    expect(() => fireEvent.press(getByTestId('quick-score-plus'))).not.toThrow();
  });

  it('should not call onDecrement if callback not provided', () => {
    const { getByTestId } = renderWithTheme(<QuickScoreInput score={3} />);

    // Should not crash
    expect(() => fireEvent.press(getByTestId('quick-score-minus'))).not.toThrow();
  });

  describe('First tap behavior on unplayed holes', () => {
    it('should call onIncrement with par when plus pressed on null score', () => {
      const mockIncrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={null} par={3} onIncrement={mockIncrement} />,
      );

      fireEvent.press(getByTestId('quick-score-plus'));
      expect(mockIncrement).toHaveBeenCalledWith(3); // par
    });

    it('should call onDecrement with par-1 when minus pressed on null score', () => {
      const mockDecrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={null} par={4} onDecrement={mockDecrement} />,
      );

      fireEvent.press(getByTestId('quick-score-minus'));
      expect(mockDecrement).toHaveBeenCalledWith(3); // birdie (par-1)
    });

    it('should increment normally when score is not null', () => {
      const mockIncrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={3} par={3} onIncrement={mockIncrement} />,
      );

      fireEvent.press(getByTestId('quick-score-plus'));
      expect(mockIncrement).toHaveBeenCalledWith(4); // 3+1
    });

    it('should decrement normally when score is not null', () => {
      const mockDecrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={4} par={3} onDecrement={mockDecrement} />,
      );

      fireEvent.press(getByTestId('quick-score-minus'));
      expect(mockDecrement).toHaveBeenCalledWith(3); // 4-1
    });
  });

  describe('Score Update Logic', () => {
    it('should update score when increment button pressed', () => {
      const mockIncrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={3} par={3} onIncrement={mockIncrement} />,
      );

      fireEvent.press(getByTestId('quick-score-plus'));

      expect(mockIncrement).toHaveBeenCalledTimes(1);
      expect(mockIncrement).toHaveBeenCalledWith(4);
    });

    it('should update score when decrement button pressed', () => {
      const mockDecrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={4} par={3} onDecrement={mockDecrement} />,
      );

      fireEvent.press(getByTestId('quick-score-minus'));

      expect(mockDecrement).toHaveBeenCalledTimes(1);
      expect(mockDecrement).toHaveBeenCalledWith(3);
    });

    it('should handle first tap behavior (null to par)', () => {
      const mockIncrement = jest.fn();
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={null} par={3} onIncrement={mockIncrement} />,
      );

      fireEvent.press(getByTestId('quick-score-plus'));

      expect(mockIncrement).toHaveBeenCalledTimes(1);
      expect(mockIncrement).toHaveBeenCalledWith(3);
    });
  });

  describe('Color-Coded Score Display', () => {
    it('should show green for birdie or better', () => {
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={2} par={3} />,
      );

      const display = getByTestId('quick-score-display');
      const displayStyle = display.props.style;

      // Birdie (par - 1) should be green/success color
      expect(displayStyle.color).toBe('#4CAF50'); // success color from theme
    });

    it('should show default color for par', () => {
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={3} par={3} />,
      );

      const display = getByTestId('quick-score-display');
      const displayStyle = display.props.style;

      // Par should use default text color
      expect(displayStyle.color).toBe('#212121'); // text color from theme
    });

    it('should show orange for bogey', () => {
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={4} par={3} />,
      );

      const display = getByTestId('quick-score-display');
      const displayStyle = display.props.style;

      // Bogey (par + 1) should be orange/warning color
      expect(displayStyle.color).toBe('#F57C00'); // warning color from theme
    });

    it('should show red for double bogey or worse', () => {
      const { getByTestId } = renderWithTheme(
        <QuickScoreInput score={5} par={3} />,
      );

      const display = getByTestId('quick-score-display');
      const displayStyle = display.props.style;

      // Double bogey or worse (par + 2+) should be red/error color
      expect(displayStyle.color).toBe('#D32F2F'); // error color from theme
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger selection haptic on increment button press', () => {
      const mockIncrement = jest.fn();
      const hapticService = require('../../../src/services/hapticService');
      jest.spyOn(hapticService, 'triggerSelectionHaptic');

      const { getByTestId } = renderWithTheme(
        <QuickScoreInput
          score={3}
          par={3}
          onIncrement={mockIncrement}
        />,
      );

      const plusButton = getByTestId('quick-score-plus');
      fireEvent.press(plusButton);

      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalled();
    });

    it('should trigger selection haptic on decrement button press', () => {
      const mockDecrement = jest.fn();
      const hapticService = require('../../../src/services/hapticService');
      jest.spyOn(hapticService, 'triggerSelectionHaptic');

      const { getByTestId } = renderWithTheme(
        <QuickScoreInput
          score={3}
          par={3}
          onDecrement={mockDecrement}
        />,
      );

      const minusButton = getByTestId('quick-score-minus');
      fireEvent.press(minusButton);

      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalled();
    });
  });
});
