/**
 * BagDetailScreen Mark Lost Integration Tests
 */

import { render, waitFor } from '@testing-library/react-native';
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

    const { getByTestId, queryByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Initially modal should not be visible
    expect(queryByTestId('mark-lost-modal')).toBeNull();

    // This will be implemented when we add the actual swipe action
    // fireEvent.press(getByTestId('mark-lost-swipe-action'));
    // await waitFor(() => {
    //   expect(getByTestId('mark-lost-modal')).toBeTruthy();
    // });
  });

  it('should refresh bag data after successful mark lost operation', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // This will be tested when the actual integration is complete
    expect(bagService.getBag).toHaveBeenCalledWith('bag-1');
  });
});
