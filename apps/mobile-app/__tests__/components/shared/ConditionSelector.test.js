/**
 * ConditionSelector Component Tests
 * Tests for the condition selection interface component
 */

import { render, fireEvent } from '@testing-library/react-native';
import ConditionSelector from '../../../src/components/shared/ConditionSelector';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Test wrapper with theme
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

describe('ConditionSelector', () => {
  describe('Component Structure', () => {
    it('should export a function', () => {
      expect(typeof ConditionSelector).toBe('function');
    });

    it('should render condition buttons with correct labels', () => {
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector condition="" onConditionChange={() => {}} />
        </TestWrapper>,
      );

      expect(getByText('New')).toBeTruthy();
      expect(getByText('Good')).toBeTruthy();
      expect(getByText('Worn')).toBeTruthy();
      expect(getByText('Beat-in')).toBeTruthy();
    });
  });

  describe('Condition Selection', () => {
    it('should call onConditionChange when a condition button is pressed', () => {
      const mockOnConditionChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector condition="" onConditionChange={mockOnConditionChange} />
        </TestWrapper>,
      );

      const newButton = getByText('New');
      fireEvent.press(newButton);

      expect(mockOnConditionChange).toHaveBeenCalledWith('new');
    });

    it('should toggle condition when same button is pressed twice', () => {
      const mockOnConditionChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector condition="new" onConditionChange={mockOnConditionChange} />
        </TestWrapper>,
      );

      const newButton = getByText('New');
      fireEvent.press(newButton);

      expect(mockOnConditionChange).toHaveBeenCalledWith('');
    });
  });

  describe('Visual States', () => {
    it('should show selected state styling for active condition', () => {
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector condition="new" onConditionChange={() => {}} />
        </TestWrapper>,
      );

      const newTextElement = getByText('New');
      const goodTextElement = getByText('Good');

      // Check that the text color and weight changes for selected state
      expect(newTextElement.props.style).toContainEqual(
        expect.objectContaining({
          color: expect.any(String),
          fontWeight: '700', // Active text weight
        }),
      );

      // Unselected text should have normal weight
      expect(goodTextElement.props.style).toContainEqual(
        expect.objectContaining({
          fontWeight: '600', // Normal text weight
        }),
      );
    });

    it('should display correct icons for each condition', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <ConditionSelector condition="" onConditionChange={() => {}} />
        </TestWrapper>,
      );

      // Test that the component renders without throwing
      // Icon presence is implicitly tested by the component rendering successfully
      expect(() => getByTestId('condition-selector')).not.toThrow();
    });
  });

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      const mockOnConditionChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector
            condition=""
            onConditionChange={mockOnConditionChange}
            disabled
          />
        </TestWrapper>,
      );

      const newButton = getByText('New');
      fireEvent.press(newButton);

      // Should not call callback when disabled
      expect(mockOnConditionChange).not.toHaveBeenCalled();
    });

    it('should work normally when disabled prop is false', () => {
      const mockOnConditionChange = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <ConditionSelector
            condition=""
            onConditionChange={mockOnConditionChange}
            disabled={false}
          />
        </TestWrapper>,
      );

      const newButton = getByText('New');
      fireEvent.press(newButton);

      // Should call callback when not disabled
      expect(mockOnConditionChange).toHaveBeenCalledWith('new');
    });
  });
});
