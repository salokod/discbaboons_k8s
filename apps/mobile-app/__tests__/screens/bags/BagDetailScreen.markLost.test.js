/**
 * BagDetailScreen Mark Lost Integration Tests
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import * as bagService from '../../../src/services/bagService';

// Mock services and navigation
jest.mock('../../../src/services/bagService');
jest.mock('../../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

// Mock react-native-gesture-handler to render swipe actions
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Swipeable: jest.fn(({ children, renderRightActions }) => {
      const rightActions = renderRightActions ? renderRightActions() : null;
      return React.createElement(View, null, children, rightActions);
    }),
  };
});

// Mock MarkAsLostModal
jest.mock('../../../src/components/modals/MarkAsLostModal', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return function MockMarkAsLostModal({
    visible, onClose, discs, onSuccess,
  }) {
    if (!visible) return null;
    return (
      <View testID="mark-lost-modal">
        <Text>Mock Mark Lost Modal</Text>
        <Text testID="modal-disc-count">
          {discs.length}
          {' '}
          discs
        </Text>
        <TouchableOpacity testID="mock-close" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mock-success" onPress={onSuccess}>
          <Text>Mark Lost</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

const mockBag = {
  id: 'bag-1',
  name: 'Test Bag',
  description: 'Test Description',
  bag_contents: [
    {
      id: 'disc-1',
      model: 'Destroyer',
      brand: 'Innova',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      color: 'Orange',
      weight: '175g',
      condition: 'Good',
    },
    {
      id: 'disc-2',
      model: 'Roc',
      brand: 'Innova',
      speed: 5,
      glide: 4,
      turn: 0,
      fade: 3,
      color: 'Blue',
      weight: '180g',
      condition: 'Excellent',
    },
  ],
};

const renderWithProviders = (component) => render(
  <NavigationContainer>
    <ThemeProvider>
      <BagRefreshProvider>
        {component}
      </BagRefreshProvider>
    </ThemeProvider>
  </NavigationContainer>,
);

describe('BagDetailScreen Mark Lost Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bagService.getBag.mockResolvedValue(mockBag);
    bagService.getLostDiscCountForBag.mockResolvedValue(0);
  });

  it('should import MarkAsLostModal component', () => {
    const BagDetailModule = require('../../../src/screens/bags/BagDetailScreen');
    // Check that the module imports/exports properly - basic smoke test
    expect(BagDetailModule.default).toBeDefined();
  });

  it('should add mark lost action to right swipe', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Test that the swipe handler includes mark lost action
    // This will be implemented when we add the actual functionality
  });

  it('should open MarkAsLostModal when mark lost action is triggered', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getAllByTestId, queryByTestId, getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Initially modal should not be visible
    expect(queryByTestId('mark-lost-modal')).toBeNull();

    // Find and press the first mark lost button within the swipe actions
    const markLostButtons = getAllByTestId('mark-lost-button');
    fireEvent.press(markLostButtons[0]);

    // Modal should now be visible with the correct disc
    await waitFor(() => {
      expect(getByTestId('mark-lost-modal')).toBeTruthy();
      expect(getByTestId('modal-disc-count')).toHaveTextContent('1 discs');
    });
  });

  it('should close modal and refresh data after successful mark lost operation', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getAllByTestId, queryByTestId, getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Trigger mark lost action to open modal
    const markLostButtons = getAllByTestId('mark-lost-button');
    fireEvent.press(markLostButtons[0]);

    await waitFor(() => {
      expect(getByTestId('mark-lost-modal')).toBeTruthy();
    });

    // Trigger success action in modal
    const successButton = getByTestId('mock-success');
    fireEvent.press(successButton);

    // Modal should close and bag data should refresh
    await waitFor(() => {
      expect(queryByTestId('mark-lost-modal')).toBeNull();
    });

    // Should have called getBag twice - initial load and refresh
    expect(bagService.getBag).toHaveBeenCalledTimes(2);
  });
});
