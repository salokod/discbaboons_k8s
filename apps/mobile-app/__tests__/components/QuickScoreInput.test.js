/**
 * QuickScoreInput Component Tests
 */

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import QuickScoreInput from '../../src/components/scorecard/QuickScoreInput';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('QuickScoreInput component', () => {
  it('should export a QuickScoreInput component', () => {
    const QuickScoreInputModule = require('../../src/components/scorecard/QuickScoreInput');
    expect(QuickScoreInputModule.default).toBeDefined();
    expect(typeof QuickScoreInputModule.default).toBe('function');
  });

  it('should render with basic props', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <QuickScoreInput score={3} par={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />
      </ThemeProvider>,
    );

    expect(getByTestId('quick-score-input')).toBeTruthy();
  });

  it('should render touch targets at 56x56 minimum (WCAG AA)', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <QuickScoreInput score={3} par={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />
      </ThemeProvider>,
    );

    const minusButton = getByTestId('quick-score-minus');
    const plusButton = getByTestId('quick-score-plus');

    // Access the Animated.View which is the child of the Pressable
    // The style is in the Animated.View which is children[0] (the button style is in the array)
    const minusAnimatedView = minusButton.children[0];
    const plusAnimatedView = plusButton.children[0];

    // The style array contains the button style object
    const minusStyleArray = minusAnimatedView.props.style;
    const plusStyleArray = plusAnimatedView.props.style;

    // Flatten the style array to get the actual values
    const minusStyle = StyleSheet.flatten(minusStyleArray);
    const plusStyle = StyleSheet.flatten(plusStyleArray);

    expect(minusStyle.width).toBe(56);
    expect(minusStyle.height).toBe(56);
    expect(plusStyle.width).toBe(56);
    expect(plusStyle.height).toBe(56);
  });

  describe('Accessibility', () => {
    it('should have accessibility hint on decrement button', () => {
      const { getByTestId } = render(
        <ThemeProvider testMode>
          <QuickScoreInput score={3} par={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />
        </ThemeProvider>,
      );

      const minusButton = getByTestId('quick-score-minus');
      expect(minusButton.props.accessibilityHint).toBe('Decrease score by 1 stroke');
    });

    it('should have accessibility hint on increment button', () => {
      const { getByTestId } = render(
        <ThemeProvider testMode>
          <QuickScoreInput score={3} par={3} onIncrement={jest.fn()} onDecrement={jest.fn()} />
        </ThemeProvider>,
      );

      const plusButton = getByTestId('quick-score-plus');
      expect(plusButton.props.accessibilityHint).toBe('Increase score by 1 stroke');
    });
  });
});
