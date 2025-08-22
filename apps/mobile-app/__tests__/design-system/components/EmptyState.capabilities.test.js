/**
 * EmptyState Component Capabilities Test
 * Tests to verify current EmptyState component capabilities before modification
 */

import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../../../src/design-system/components/EmptyState';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock theme context
const mockTheme = {
  colors: {
    text: '#000000',
    textLight: '#666666',
  },
};

function TestWrapper({ children }) {
  return (
    <ThemeProvider value={mockTheme}>
      {children}
    </ThemeProvider>
  );
}

describe('EmptyState - Current Capabilities', () => {
  it('should export a function', () => {
    expect(typeof EmptyState).toBe('function');
  });

  it('should render with basic props using correct API', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          subtitle="Test Subtitle"
          actionLabel="Test Action"
          onAction={() => {}}
        />
      </TestWrapper>,
    );

    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
    expect(getByText('Test Action')).toBeTruthy();
  });

  it('should call onAction when action button is pressed', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          actionLabel="Test Action"
          onAction={mockOnAction}
        />
      </TestWrapper>,
    );

    fireEvent.press(getByText('Test Action'));
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('should support secondary action props', () => {
    const { queryByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          actionLabel="Primary Action"
          onAction={() => {}}
          secondaryActionText="Secondary Action"
          onSecondaryActionPress={() => {}}
        />
      </TestWrapper>,
    );

    expect(queryByText('Primary Action')).toBeTruthy();
    expect(queryByText('Secondary Action')).toBeTruthy(); // Should render
  });
});
