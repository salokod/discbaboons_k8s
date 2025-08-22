/**
 * EmptyState Component Secondary Action Test
 * Tests for the enhanced EmptyState component with secondary action support
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

describe('EmptyState - Secondary Action Support', () => {
  it('should render both primary and secondary action buttons when both are provided', () => {
    const { getByText } = render(
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

    expect(getByText('Primary Action')).toBeTruthy();
    expect(getByText('Secondary Action')).toBeTruthy();
  });

  it('should call onSecondaryActionPress when secondary button is pressed', () => {
    const mockSecondaryAction = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          actionLabel="Primary Action"
          onAction={() => {}}
          secondaryActionText="Secondary Action"
          onSecondaryActionPress={mockSecondaryAction}
        />
      </TestWrapper>,
    );

    fireEvent.press(getByText('Secondary Action'));
    expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it('should not render secondary button when only secondary text is provided without handler', () => {
    const { queryByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          actionLabel="Primary Action"
          onAction={() => {}}
          secondaryActionText="Secondary Action"
        />
      </TestWrapper>,
    );

    expect(queryByText('Primary Action')).toBeTruthy();
    expect(queryByText('Secondary Action')).toBeNull();
  });

  it('should maintain backward compatibility with existing props', () => {
    const mockPrimaryAction = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <EmptyState
          title="Test Title"
          subtitle="Test Subtitle"
          actionLabel="Primary Action"
          onAction={mockPrimaryAction}
        />
      </TestWrapper>,
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();

    fireEvent.press(getByText('Primary Action'));
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('should render secondary button with outline variant', () => {
    const { getByTestId } = render(
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

    const secondaryAction = getByTestId('empty-state-secondary-action');
    expect(secondaryAction).toBeTruthy();
  });
});
