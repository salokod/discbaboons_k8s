/**
 * MarkAsLostModal Component Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MarkAsLostModal from '../../../src/components/modals/MarkAsLostModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as bagService from '../../../src/services/bagService';

// Mock services
jest.mock('../../../src/services/bagService');
jest.mock('../../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the BagRefreshContext for all tests
const mockTriggerBagRefresh = jest.fn();
const mockTriggerBagListRefresh = jest.fn();
jest.mock('../../../src/context/BagRefreshContext', () => ({
  useBagRefreshContext: jest.fn(() => ({
    triggerBagRefresh: mockTriggerBagRefresh,
    triggerBagListRefresh: mockTriggerBagListRefresh,
  })),
}));

describe('MarkAsLostModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerBagRefresh.mockClear();
    mockTriggerBagListRefresh.mockClear();
  });

  it('should export MarkAsLostModal component', () => {
    expect(typeof MarkAsLostModal).toBe('function');
  });

  it('should accept basic props without crashing', () => {
    expect(() => {
      render(
        <ThemeProvider>
          <MarkAsLostModal
            visible={false}
            onClose={jest.fn()}
            discs={[]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );
    }).not.toThrow();
  });

  it('should not render when visible is false', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <MarkAsLostModal
          visible={false}
          onClose={jest.fn()}
          discs={[]}
          currentBagId="test-bag-id"
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(queryByTestId('mark-as-lost-modal')).toBeNull();
  });

  describe('Slice 2: Modal UI Structure', () => {
    it('should display modal header with title when visible', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('modal-header')).toBeTruthy();
      expect(getByText('Mark Discs as Lost (1)')).toBeTruthy();
    });

    it('should display close button in header', () => {
      const mockClose = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={mockClose}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('close-button')).toBeTruthy();
    });

    it('should show correct disc count in title', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Roc', brand: 'Innova' },
              { id: '3', model: 'Aviar', brand: 'Innova' },
            ]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Mark Discs as Lost (3)')).toBeTruthy();
    });

    it('should display modal content structure', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('modal-content')).toBeTruthy();
      expect(getByTestId('modal-body')).toBeTruthy();
    });
  });

  describe('Slice 3: Notes Input Field', () => {
    it('should display notes input field', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('notes-input')).toBeTruthy();
    });

    it('should display notes label', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Notes')).toBeTruthy();
    });

    it('should show character count', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('character-count')).toBeTruthy();
    });

    it('should enforce 500 character limit', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const notesInput = getByTestId('notes-input');
      expect(notesInput.props.maxLength).toBe(500);
    });

    it('should show placeholder text', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const notesInput = getByTestId('notes-input');
      expect(notesInput.props.placeholder).toBe('Add optional notes about when and where the disc was lost...');
    });
  });

  describe('Slice 4: API Integration', () => {
    it('should display Mark as Lost button', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('mark-lost-button')).toBeTruthy();
    });

    it('should call markDiscAsLost for single disc', async () => {
      const mockMarkDiscAsLost = bagService.markDiscAsLost;
      mockMarkDiscAsLost.mockResolvedValue({});
      const mockOnSuccess = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: 'disc-1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={mockOnSuccess}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('mark-lost-button'));

      await waitFor(() => {
        expect(mockMarkDiscAsLost).toHaveBeenCalledWith('disc-1', true, '');
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should call bulkMarkDiscsAsLost for multiple discs', async () => {
      const mockBulkMarkDiscsAsLost = bagService.bulkMarkDiscsAsLost;
      mockBulkMarkDiscsAsLost.mockResolvedValue({});
      const mockOnSuccess = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: 'disc-1', model: 'Destroyer', brand: 'Innova' },
              { id: 'disc-2', model: 'Roc', brand: 'Innova' },
            ]}
            currentBagId="test-bag-id"
            onSuccess={mockOnSuccess}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('mark-lost-button'));

      await waitFor(() => {
        expect(mockBulkMarkDiscsAsLost).toHaveBeenCalledWith(['disc-1', 'disc-2'], '');
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should pass notes to API when provided', async () => {
      const mockMarkDiscAsLost = bagService.markDiscAsLost;
      mockMarkDiscAsLost.mockResolvedValue({});

      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: 'disc-1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const notesInput = getByTestId('notes-input');
      fireEvent.changeText(notesInput, 'Lost at hole 7');
      fireEvent.press(getByTestId('mark-lost-button'));

      await waitFor(() => {
        expect(mockMarkDiscAsLost).toHaveBeenCalledWith('disc-1', true, 'Lost at hole 7');
      });
    });

    it('should show loading state during API call', async () => {
      const mockMarkDiscAsLost = bagService.markDiscAsLost;
      // Mock delay to test loading state
      mockMarkDiscAsLost.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({}), 100);
      }));

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: 'disc-1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('mark-lost-button'));

      // Should show loading state
      expect(getByText('Marking as Lost...')).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      const mockMarkDiscAsLost = bagService.markDiscAsLost;
      mockMarkDiscAsLost.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[{ id: 'disc-1', model: 'Destroyer', brand: 'Innova' }]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('mark-lost-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Mark as Lost Failed',
          'Unable to mark discs as lost. Please try again.',
          [{ text: 'OK', style: 'default' }],
        );
      });
    });
  });

  describe('Slice 5: SwipeableDiscRow Integration', () => {
    it('should accept discs from SwipeableDiscRow swipe action', () => {
      const discs = [
        { id: 'disc-1', model: 'Destroyer', brand: 'Innova' },
        { id: 'disc-2', model: 'Roc', brand: 'Innova' },
      ];

      const { getByText } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={discs}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Mark Discs as Lost (2)')).toBeTruthy();
    });

    it('should handle single disc from right swipe action', () => {
      const disc = { id: 'disc-1', model: 'Destroyer', brand: 'Innova' };

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <MarkAsLostModal
            visible
            onClose={jest.fn()}
            discs={[disc]}
            currentBagId="test-bag-id"
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Mark Discs as Lost (1)')).toBeTruthy();
      // Check button using testID since text appears in multiple places
      expect(getByTestId('mark-lost-button')).toBeTruthy();
    });
  });
});
