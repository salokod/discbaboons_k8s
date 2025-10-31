/**
 * NavigationHeader Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import NavigationHeader from '../../src/components/NavigationHeader';

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    text: '#212121',
    textLight: '#757575',
    surface: '#FFFFFF',
    background: '#FAFBFC',
    border: '#E0E0E0',
  })),
}));

describe('NavigationHeader', () => {
  it('should export a function', () => {
    expect(NavigationHeader).toBeDefined();
    expect(typeof NavigationHeader).toBe('object'); // React.memo returns an object
  });

  it('should render header with title', () => {
    const mockOnBack = jest.fn();
    const { getByTestId, getByText } = render(
      <NavigationHeader title="Test Title" onBack={mockOnBack} />,
    );

    expect(getByTestId('navigation-header')).toBeTruthy();
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should render back button when onBack prop provided', () => {
    const mockOnBack = jest.fn();
    const { getByTestId } = render(
      <NavigationHeader title="Test Title" onBack={mockOnBack} />,
    );

    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should not render back button when onBack prop not provided', () => {
    const { queryByTestId } = render(
      <NavigationHeader title="Test Title" />,
    );

    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should call onBack when back button is pressed', () => {
    const mockOnBack = jest.fn();
    const { getByTestId } = render(
      <NavigationHeader title="Test Title" onBack={mockOnBack} />,
    );

    fireEvent.press(getByTestId('back-button'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should support custom accessibility labels', () => {
    const mockOnBack = jest.fn();
    const { getByTestId } = render(
      <NavigationHeader
        title="Test Title"
        onBack={mockOnBack}
        backAccessibilityLabel="Return to previous page"
      />,
    );

    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Return to previous page');
  });

  it('should render optional right action', () => {
    const mockOnBack = jest.fn();
    const mockRightAction = jest.fn();
    const { getByTestId } = render(
      <NavigationHeader
        title="Test Title"
        onBack={mockOnBack}
        rightAction={mockRightAction}
        rightAccessibilityLabel="Settings"
      />,
    );

    expect(getByTestId('right-action')).toBeTruthy();
  });

  it('should call rightAction when right button is pressed', () => {
    const mockOnBack = jest.fn();
    const mockRightAction = jest.fn();
    const { getByTestId } = render(
      <NavigationHeader
        title="Test Title"
        onBack={mockOnBack}
        rightAction={mockRightAction}
        rightAccessibilityLabel="Settings"
      />,
    );

    fireEvent.press(getByTestId('right-action'));
    expect(mockRightAction).toHaveBeenCalledTimes(1);
  });

  it('should render custom right component when provided', () => {
    const { Text } = require('react-native');
    const mockOnBack = jest.fn();
    function CustomComponent() {
      return <Text testID="custom-component">Custom</Text>;
    }

    const { getByTestId, getByText } = render(
      <NavigationHeader
        title="Test Title"
        onBack={mockOnBack}
        rightComponent={<CustomComponent />}
      />,
    );

    expect(getByTestId('custom-component')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('should prefer rightComponent over rightAction when both provided', () => {
    const { Text } = require('react-native');
    const mockOnBack = jest.fn();
    const mockRightAction = jest.fn();
    function CustomComponent() {
      return <Text testID="custom-component">Custom</Text>;
    }

    const { getByTestId, queryByTestId } = render(
      <NavigationHeader
        title="Test Title"
        onBack={mockOnBack}
        rightAction={mockRightAction}
        rightComponent={<CustomComponent />}
      />,
    );

    expect(getByTestId('custom-component')).toBeTruthy();
    expect(queryByTestId('right-action')).toBeNull();
  });
});
