/**
 * Test suite to verify DeleteBagConfirmationModal handles null bag prop correctly
 * This test ensures the fix for the critical runtime error is working
 */

import { render } from '@testing-library/react-native';
import DeleteBagConfirmationModal from '../../../src/components/modals/DeleteBagConfirmationModal';

// Mock the theme context
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    surface: '#ffffff',
    text: '#000000',
    textLight: '#666666',
    border: '#e0e0e0',
    primary: '#007AFF',
    warning: '#FFA500',
    error: '#FF0000',
    success: '#00FF00',
    background: '#f5f5f5',
    white: '#ffffff',
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock the bag service
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
  getBag: jest.fn(),
  moveDiscBetweenBags: jest.fn(),
}));

describe('DeleteBagConfirmationModal - Null Safety', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not crash when bag prop is null', () => {
    const { toJSON } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={null}
        loading={false}
      />,
    );

    // Should return null without crashing
    expect(toJSON()).toBeNull();
  });

  it('should not crash when bag prop is undefined', () => {
    const { toJSON } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={undefined}
        loading={false}
      />,
    );

    // Should return null without crashing
    expect(toJSON()).toBeNull();
  });

  it('should render correctly when bag prop is valid', () => {
    const validBag = {
      id: 'test-bag-123',
      name: 'Test Bag',
      description: 'A test bag',
      disc_count: 5,
    };

    const { getByText } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={validBag}
        loading={false}
      />,
    );

    // Should render the bag name
    expect(getByText('Test Bag')).toBeTruthy();
    expect(getByText('5 discs')).toBeTruthy();
    expect(getByText('A test bag')).toBeTruthy();
  });

  it('should handle bag with missing optional properties', () => {
    const minimalBag = {
      id: 'test-bag-456',
      name: 'Minimal Bag',
      // No description or disc_count
    };

    const { getByText, queryByText } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={minimalBag}
        loading={false}
      />,
    );

    // Should render the bag name
    expect(getByText('Minimal Bag')).toBeTruthy();
    // Should handle missing disc_count gracefully
    expect(getByText('0 discs')).toBeTruthy();
    // Should not render description if not provided
    expect(queryByText('undefined')).toBeNull();
  });

  it('should not execute callbacks when bag is null', () => {
    const { queryByText } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={null}
        loading={false}
      />,
    );

    // Modal should not render any content
    expect(queryByText('Delete Bag')).toBeNull();

    // Callbacks should not have been called
    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should handle callback execution safely when bag becomes null after render', () => {
    const mockNavigation = { navigate: jest.fn() };

    // Start with valid bag, then set to null (simulating a race condition)
    const initialBag = {
      id: 'test-bag-789',
      name: 'Race Condition Bag',
      disc_count: 3,
    };

    const { rerender } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={initialBag}
        navigation={mockNavigation}
        loading={false}
      />,
    );

    // Now set bag to null (simulating component receiving null prop after initial render)
    rerender(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={null}
        navigation={mockNavigation}
        loading={false}
      />,
    );

    // Component should handle the transition gracefully and not crash
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('should handle getBags service call safely when bag is null', async () => {
    // Mock getBags to simulate the service call
    const mockGetBags = require('../../../src/services/bagService').getBags;
    mockGetBags.mockResolvedValue({ bags: [] });

    const initialBag = {
      id: 'test-bag-service',
      name: 'Service Test Bag',
      disc_count: 5,
    };

    const { rerender, queryByText } = render(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={initialBag}
        loading={false}
      />,
    );

    // Simulate bag becoming null after component mount but before service calls
    rerender(
      <DeleteBagConfirmationModal
        visible
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        bag={null}
        loading={false}
      />,
    );

    // Component should not render when bag is null
    expect(queryByText('Move Discs First')).toBeNull();
    expect(mockGetBags).not.toHaveBeenCalled();
  });
});
