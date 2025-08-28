/**
 * BagDetailScreen Long Press Haptic Feedback Tests
 * Tests enhanced haptic feedback for multi-select mode entry
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import * as bagService from '../../../src/services/bagService';
import * as hapticService from '../../../src/services/hapticService';

// Mock services
jest.mock('../../../src/services/bagService');
jest.mock('../../../src/services/hapticService', () => ({
  triggerSelectionHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

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

describe('BagDetailScreen Long Press Haptic Feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bagService.getBag.mockResolvedValue(mockBag);
    bagService.getLostDiscCountForBag.mockResolvedValue(0);
  });

  it('should trigger selection haptic feedback when long pressing disc to enter multi-select mode', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Long press on a disc row to trigger multi-select mode
    const discRow = getByTestId('swipeable-disc-row-disc-1');
    fireEvent(discRow, 'longPress');

    // Should trigger selection haptic feedback
    expect(hapticService.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
  });

  it('should trigger selection haptic feedback when selecting/deselecting discs in multi-select mode', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getByTestId, getAllByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Enter multi-select mode first
    const discRow = getByTestId('swipeable-disc-row-disc-1');
    fireEvent(discRow, 'longPress');

    // Clear previous calls
    hapticService.triggerSelectionHaptic.mockClear();

    // Select another disc in multi-select mode by pressing its checkbox
    // In multi-select mode, SelectableDiscRow is used which has a selection checkbox
    await waitFor(() => {
      const selectionCheckboxes = getAllByTestId('selection-checkbox');
      expect(selectionCheckboxes.length).toBeGreaterThan(1);
    });

    const selectionCheckboxes = getAllByTestId('selection-checkbox');
    fireEvent.press(selectionCheckboxes[1]); // Press checkbox for second disc

    // Should trigger selection haptic feedback for the additional selection
    expect(hapticService.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
  });

  it('should provide visual feedback during long press', async () => {
    const mockRoute = { params: { bagId: 'bag-1' } };
    const mockNavigation = { goBack: jest.fn() };

    const { getByTestId } = renderWithProviders(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('swipeable-disc-row-disc-1')).toBeTruthy();
    });

    // Long press should enter multi-select mode and provide visual feedback
    const discRow = getByTestId('swipeable-disc-row-disc-1');
    fireEvent(discRow, 'longPress');

    // Wait for multi-select mode to activate
    await waitFor(() => {
      // Should show the multi-select header which indicates visual feedback
      expect(getByTestId('multi-select-header')).toBeTruthy();
    });
  });
});
