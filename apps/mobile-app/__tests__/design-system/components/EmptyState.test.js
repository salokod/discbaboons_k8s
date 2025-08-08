/**
 * EmptyState Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import EmptyState from '../../../src/design-system/components/EmptyState';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('EmptyState component', () => {
  it('should export a component', () => {
    expect(EmptyState).toBeTruthy();
  });

  it('should render empty state container', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <EmptyState />
      </ThemeProvider>,
    );

    expect(getByTestId('empty-state')).toBeTruthy();
  });

  it('should display title text', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState title="No bags yet" />
      </ThemeProvider>,
    );

    expect(getByText('No bags yet')).toBeTruthy();
  });

  it('should display subtitle text', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState
          title="No bags yet"
          subtitle="Create your first bag to get started"
        />
      </ThemeProvider>,
    );

    expect(getByText('Create your first bag to get started')).toBeTruthy();
  });

  it('should render action button when provided', () => {
    const onActionMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState
          title="No bags yet"
          actionLabel="Create First Bag"
          onAction={onActionMock}
        />
      </ThemeProvider>,
    );

    expect(getByText('Create First Bag')).toBeTruthy();
  });

  it('should call onAction when action button is pressed', () => {
    const onActionMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState
          title="No bags yet"
          actionLabel="Create First Bag"
          onAction={onActionMock}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Create First Bag'));
    expect(onActionMock).toHaveBeenCalledTimes(1);
  });

  it('should render custom children content', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState title="No bags yet">
          <Text>Custom content here</Text>
        </EmptyState>
      </ThemeProvider>,
    );

    expect(getByText('Custom content here')).toBeTruthy();
  });

  it('should not render action button when no actionLabel provided', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <EmptyState title="No bags yet" />
      </ThemeProvider>,
    );

    expect(queryByTestId('empty-state-action')).toBeNull();
  });
});
