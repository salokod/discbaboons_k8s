/**
 * EmptyBagsScreen Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import EmptyBagsScreen from '../../../src/screens/bags/EmptyBagsScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('EmptyBagsScreen', () => {
  it('should export a EmptyBagsScreen component', () => {
    expect(EmptyBagsScreen).toBeTruthy();
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <EmptyBagsScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('empty-bags-screen')).toBeTruthy();
  });

  it('should display empty state with title and subtitle', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen />
      </ThemeProvider>,
    );

    expect(getByText('Organize Your Disc Golf Collection')).toBeTruthy();
    expect(getByText('Keep track of all your discs, bags, and home collection. Create bags like \'Home Collection\', \'Tournament Bag\', or \'Glow Round\' to organize your discs however you like.')).toBeTruthy();
  });

  it('should display create first bag button', () => {
    const mockOnCreate = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen onCreateFirstBag={mockOnCreate} />
      </ThemeProvider>,
    );

    expect(getByText('Create First Bag')).toBeTruthy();
  });

  it('should call onCreateFirstBag when button is pressed', () => {
    const onCreateFirstBagMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen onCreateFirstBag={onCreateFirstBagMock} />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Create First Bag'));
    expect(onCreateFirstBagMock).toHaveBeenCalledTimes(1);
  });
});
