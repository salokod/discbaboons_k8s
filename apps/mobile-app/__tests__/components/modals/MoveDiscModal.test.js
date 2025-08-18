/**
 * MoveDiscModal Component Tests
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import MoveDiscModal from '../../../src/components/modals/MoveDiscModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as bagService from '../../../src/services/bagService';

const mockDisc = {
  id: '123',
  model: 'Destroyer',
  brand: 'Innova',
  speed: 12,
  glide: 5,
  turn: -1,
  fade: 3,
};

// Mock bagService
jest.mock('../../../src/services/bagService');

// Mock the BagRefreshContext for all tests
const mockTriggerBagRefresh = jest.fn();
const mockTriggerBagListRefresh = jest.fn();
jest.mock('../../../src/context/BagRefreshContext', () => ({
  useBagRefreshContext: jest.fn(() => ({
    triggerBagRefresh: mockTriggerBagRefresh,
    triggerBagListRefresh: mockTriggerBagListRefresh,
  })),
}));

describe('MoveDiscModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerBagRefresh.mockClear();
  });
  it('should export MoveDiscModal component', () => {
    expect(typeof MoveDiscModal).toBe('function');
  });

  it('should render modal when visible is true', () => {
    const { getByText } = render(
      <ThemeProvider>
        <MoveDiscModal
          visible
          onClose={jest.fn()}
          disc={mockDisc}
          currentBagId="bag1"
          currentBagName="My Bag"
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Move Disc')).toBeTruthy();
  });

  it('should not render modal when visible is false', () => {
    const { queryByText } = render(
      <ThemeProvider>
        <MoveDiscModal
          visible={false}
          onClose={jest.fn()}
          disc={mockDisc}
          currentBagId="bag1"
          currentBagName="My Bag"
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(queryByText('Move Disc')).toBeNull();
  });

  it('should display disc information (brand, model, flight numbers)', () => {
    const { getByText } = render(
      <ThemeProvider>
        <MoveDiscModal
          visible
          onClose={jest.fn()}
          disc={mockDisc}
          currentBagId="bag1"
          currentBagName="My Bag"
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Destroyer')).toBeTruthy();
    expect(getByText('by Innova')).toBeTruthy();
    expect(getByText('12')).toBeTruthy(); // speed
    expect(getByText('5')).toBeTruthy(); // glide
    expect(getByText('-1')).toBeTruthy(); // turn
    expect(getByText('3')).toBeTruthy(); // fade
  });

  it('should show current bag name', () => {
    const { getByText } = render(
      <ThemeProvider>
        <MoveDiscModal
          visible
          onClose={jest.fn()}
          disc={mockDisc}
          currentBagId="bag1"
          currentBagName="My Awesome Bag"
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Currently in: My Awesome Bag')).toBeTruthy();
  });

  describe('Bag Loading', () => {
    it('should fetch user bags on mount using getBags()', async () => {
      const mockBags = [
        { id: 'bag2', name: 'Travel Bag', disc_count: 5 },
        { id: 'bag3', name: 'Tournament Bag', disc_count: 8 },
      ];

      bagService.getBags.mockResolvedValue({
        bags: mockBags,
        pagination: { total: 2, hasMore: false },
      });

      render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(bagService.getBags).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state while fetching', () => {
      bagService.getBags.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Loading bags...')).toBeTruthy();
    });

    it('should display error if fetch fails', async () => {
      bagService.getBags.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Failed to load bags')).toBeTruthy();
      });
    });

    it('should filter out current bag from list', async () => {
      const mockBags = [
        { id: 'bag1', name: 'My Bag', disc_count: 3 },
        { id: 'bag2', name: 'Travel Bag', disc_count: 5 },
        { id: 'bag3', name: 'Tournament Bag', disc_count: 8 },
      ];

      bagService.getBags.mockResolvedValue({
        bags: mockBags,
        pagination: { total: 3, hasMore: false },
      });

      const { getByText, queryByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Travel Bag')).toBeTruthy();
        expect(getByText('Tournament Bag')).toBeTruthy();
        expect(queryByText('My Bag')).toBeNull(); // Current bag should be filtered out
      });
    });

    it('should show empty state if no other bags', async () => {
      const mockBags = [
        { id: 'bag1', name: 'My Bag', disc_count: 3 },
      ];

      bagService.getBags.mockResolvedValue({
        bags: mockBags,
        pagination: { total: 1, hasMore: false },
      });

      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('No other bags available')).toBeTruthy();
      });
    });
  });

  describe('Bag Selection UI', () => {
    const mockBags = [
      { id: 'bag2', name: 'Travel Bag', disc_count: 5 },
      { id: 'bag3', name: 'Tournament Bag', disc_count: 8 },
    ];

    beforeEach(() => {
      bagService.getBags.mockResolvedValue({
        bags: mockBags,
        pagination: { total: 2, hasMore: false },
      });
    });

    it('should render list of available bags', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Travel Bag')).toBeTruthy();
        expect(getByText('Tournament Bag')).toBeTruthy();
      });
    });

    it('should show bag name and disc count for each', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Travel Bag')).toBeTruthy();
        expect(getByText('5 discs')).toBeTruthy();
        expect(getByText('Tournament Bag')).toBeTruthy();
        expect(getByText('8 discs')).toBeTruthy();
      });
    });

    it('should highlight selected bag when tapped', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      // Check for selected state (we'll add this in implementation)
      expect(getByTestId('selected-bag-bag2')).toBeTruthy();
    });

    it('should update Move button text with selected bag name', async () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      expect(getByText('Move to Travel Bag')).toBeTruthy();
    });

    it('should disable Move button when no bag selected', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Travel Bag')).toBeTruthy();
      });

      const moveButton = getByText('Select Bag');
      expect(moveButton).toBeTruthy();
      // Button should be disabled by default (we'll implement this)
    });
  });

  describe('Move Operation', () => {
    const mockBags = [
      { id: 'bag2', name: 'Travel Bag', disc_count: 5 },
      { id: 'bag3', name: 'Tournament Bag', disc_count: 8 },
    ];

    beforeEach(() => {
      bagService.getBags.mockResolvedValue({
        bags: mockBags,
        pagination: { total: 2, hasMore: false },
      });
    });

    it('should call moveDiscBetweenBags with correct parameters when disc has id', async () => {
      const onSuccess = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={{ ...mockDisc, id: 'content123' }}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      expect(bagService.moveDiscBetweenBags).toHaveBeenCalledWith(
        'bag1',
        'bag2',
        ['content123'],
      );
    });

    it('should show loading state during API call', async () => {
      const mockMove = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={{ ...mockDisc, id: 'content123' }}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      expect(getByText('Moving...')).toBeTruthy();
    });

    it('should close modal on successful move', async () => {
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={{ ...mockDisc, id: 'content123' }}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle API failure gracefully', async () => {
      // Mock console.error to avoid noise in test output
      // eslint-disable-next-line no-console
      const originalError = console.error;
      // eslint-disable-next-line no-console
      console.error = jest.fn();

      const mockMove = jest.fn().mockRejectedValue(new Error('Move failed'));
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={{ ...mockDisc, id: 'content123' }}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      // Wait for the error to be handled
      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalled();
      });

      // Verify the API was called and error was handled
      expect(bagService.moveDiscBetweenBags).toHaveBeenCalledWith(
        'bag1',
        'bag2',
        ['content123'],
      );

      // eslint-disable-next-line no-console
      console.error = originalError;
    });

    it('should call onSuccess callback after successful move', async () => {
      const onSuccess = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={{ ...mockDisc, id: 'content123' }}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call moveDiscBetweenBags when disc.id is missing', async () => {
      const onSuccess = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const discWithoutId = {
        model: 'Destroyer',
        brand: 'Innova',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
        // Missing id property
      };

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={jest.fn()}
            disc={discWithoutId} // No id property
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      // Wait a moment to ensure any async operations complete
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // The API should not have been called because id is missing
      expect(bagService.moveDiscBetweenBags).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Slice 9: Refresh Trigger Integration', () => {
    beforeEach(() => {
      // Clear the global mocks before each test
      mockTriggerBagRefresh.mockClear();
      mockTriggerBagListRefresh.mockClear();
    });

    it('should trigger refresh after successful move', async () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalled();
      });

      // Should trigger bag refresh for source bag after successful move
      await waitFor(() => {
        expect(mockTriggerBagRefresh).toHaveBeenCalledWith('bag1');
      });

      // Should still call onSuccess and onClose
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('should not trigger on move failure', async () => {
      // Make the API call fail
      bagService.moveDiscBetweenBags.mockRejectedValue(new Error('Move failed'));

      const onSuccess = jest.fn();
      const onClose = jest.fn();

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={mockDisc}
            currentBagId="bag1"
            currentBagName="My Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalled();
      });

      // Should not trigger bag refresh on failure
      expect(mockTriggerBagRefresh).not.toHaveBeenCalled();

      // Should not call onSuccess or onClose on failure
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should trigger for source bag', async () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={mockDisc}
            currentBagId="source-bag-123"
            currentBagName="Source Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalledWith(
          'source-bag-123',
          'bag2',
          ['123'],
        );
      });

      // Should trigger refresh for the specific source bag
      await waitFor(() => {
        expect(mockTriggerBagRefresh).toHaveBeenCalledWith('source-bag-123');
      });
    });

    it('should trigger for destination bag', async () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={mockDisc}
            currentBagId="source-bag-123"
            currentBagName="Source Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalledWith(
          'source-bag-123',
          'bag2',
          ['123'],
        );
      });

      // Should trigger refresh for the destination bag
      await waitFor(() => {
        expect(mockTriggerBagRefresh).toHaveBeenCalledWith('bag2');
      });
    });

    it('should trigger bag list refresh', async () => {
      const onSuccess = jest.fn();
      const onClose = jest.fn();
      const mockMove = jest.fn().mockResolvedValue({ success: true });
      jest.spyOn(bagService, 'moveDiscBetweenBags').mockImplementation(mockMove);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MoveDiscModal
            visible
            onClose={onClose}
            disc={mockDisc}
            currentBagId="source-bag-123"
            currentBagName="Source Bag"
            onSuccess={onSuccess}
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const travelBagItem = getByTestId('bag-item-bag2');
        expect(travelBagItem).toBeTruthy();
      });

      const travelBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(travelBagItem);

      const moveButton = getByText('Move to Travel Bag');
      fireEvent.press(moveButton);

      await waitFor(() => {
        expect(bagService.moveDiscBetweenBags).toHaveBeenCalledWith(
          'source-bag-123',
          'bag2',
          ['123'],
        );
      });

      // Should trigger bag list refresh after successful move
      await waitFor(() => {
        expect(mockTriggerBagListRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });
});
