/**
 * BagCard Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import BagCard from '../../../src/components/bags/BagCard';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  privacy: 'private',
  disc_count: 12,
};

describe('BagCard', () => {
  it('should export a BagCard component', () => {
    expect(BagCard).toBeTruthy();
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByTestId('bag-card')).toBeTruthy();
  });

  it('should display bag name', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByText('Course Bag')).toBeTruthy();
  });

  it('should display bag description', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByText('My favorite discs for the local course')).toBeTruthy();
  });

  it('should display disc count', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByText('12 discs')).toBeTruthy();
  });

  it('should call onPress when bag card is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} onPress={mockOnPress} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('bag-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockBag);
  });

  it('should show menu button when showMenu is true (default)', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByTestId('bag-menu-button')).toBeTruthy();
  });

  it('should hide menu button when showMenu is false', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} showMenu={false} />
      </ThemeProvider>,
    );

    expect(queryByTestId('bag-menu-button')).toBeNull();
  });

  it('should call onMenuPress when menu button is pressed', () => {
    const mockOnMenuPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} onMenuPress={mockOnMenuPress} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('bag-menu-button'));
    expect(mockOnMenuPress).toHaveBeenCalledWith(mockBag);
  });

  it('should not call onPress when menu button is pressed', () => {
    const mockOnPress = jest.fn();
    const mockOnMenuPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} onPress={mockOnPress} onMenuPress={mockOnMenuPress} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('bag-menu-button'));
    expect(mockOnMenuPress).toHaveBeenCalledWith(mockBag);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should have proper accessibility for menu button', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagCard bag={mockBag} />
      </ThemeProvider>,
    );

    const menuButton = getByTestId('bag-menu-button');
    expect(menuButton.props.accessibilityLabel).toBe('Bag options menu');
    expect(menuButton.props.accessibilityRole).toBe('button');
  });
});
