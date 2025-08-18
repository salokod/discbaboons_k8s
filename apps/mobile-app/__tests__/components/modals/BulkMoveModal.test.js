/**
 * BulkMoveModal Component Tests
 * Tests the BulkMoveModal component functionality following TDD methodology
 * Testing bulk move operations for multiple selected discs
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import BulkMoveModal from '../../../src/components/modals/BulkMoveModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import { getBags, moveDiscBetweenBags } from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
  moveDiscBetweenBags: jest.fn(),
}));

// Helper to render component with theme and providers
const renderWithTheme = (component) => render(
  <ThemeProvider>
    <BagRefreshProvider>
      {component}
    </BagRefreshProvider>
  </ThemeProvider>,
);

describe('BulkMoveModal Component', () => {
  describe('Component Structure', () => {
    it('should export a function', () => {
      expect(typeof BulkMoveModal).toBe('function');
    });

    it('should render without crashing with required props', () => {
      const mockProps = {
        visible: false,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      expect(() => {
        renderWithTheme(
          <BulkMoveModal
            visible={mockProps.visible}
            onClose={mockProps.onClose}
            selectedDiscIds={mockProps.selectedDiscIds}
            currentBagId={mockProps.currentBagId}
            currentBagName={mockProps.currentBagName}
            onSuccess={mockProps.onSuccess}
          />,
        );
      }).not.toThrow();
    });

    it('should not render modal when visible is false', () => {
      const mockProps = {
        visible: false,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { queryByTestId } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );
      expect(queryByTestId('bulk-move-modal')).toBeNull();
    });

    it('should render modal when visible is true', () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByTestId } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );
      expect(getByTestId('bulk-move-modal')).toBeTruthy();
    });
  });

  describe('Bag Loading', () => {
    const mockBags = {
      bags: [
        { id: 'bag-2', name: 'Target Bag 1', disc_count: 5 },
        { id: 'bag-3', name: 'Target Bag 2', disc_count: 3 },
      ],
    };

    beforeEach(() => {
      getBags.mockResolvedValue(mockBags);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should show loading state when modal opens', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByText } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );

      expect(getByText('Loading bags...')).toBeTruthy();
    });

    it('should load and display available bags', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByText } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );

      await waitFor(() => {
        expect(getByText('Target Bag 1')).toBeTruthy();
        expect(getByText('Target Bag 2')).toBeTruthy();
      });

      expect(getBags).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bag Selection and Move', () => {
    const mockBags = {
      bags: [
        { id: 'bag-2', name: 'Target Bag 1', disc_count: 5 },
        { id: 'bag-3', name: 'Target Bag 2', disc_count: 3 },
      ],
    };

    beforeEach(() => {
      getBags.mockResolvedValue(mockBags);
      moveDiscBetweenBags.mockResolvedValue({ success: true });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should allow bag selection', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByTestId, getByText } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(getByText('Target Bag 1')).toBeTruthy();
      });

      // Select a bag
      fireEvent.press(getByTestId('bag-item-bag-2'));

      // Should show selection indicator
      expect(getByTestId('selected-bag-bag-2')).toBeTruthy();
    });

    it('should show move button when bag is selected', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByTestId, getByText } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(getByText('Target Bag 1')).toBeTruthy();
      });

      // Select a bag
      fireEvent.press(getByTestId('bag-item-bag-2'));

      // Should show move button
      expect(getByText('Move to Target Bag 1')).toBeTruthy();
    });

    it('should perform bulk move when move button is pressed', async () => {
      const mockProps = {
        visible: true,
        onClose: jest.fn(),
        selectedDiscIds: ['disc-1', 'disc-2'],
        currentBagId: 'bag-1',
        currentBagName: 'Test Bag',
        onSuccess: jest.fn(),
      };

      const { getByTestId, getByText } = renderWithTheme(
        <BulkMoveModal
          visible={mockProps.visible}
          onClose={mockProps.onClose}
          selectedDiscIds={mockProps.selectedDiscIds}
          currentBagId={mockProps.currentBagId}
          currentBagName={mockProps.currentBagName}
          onSuccess={mockProps.onSuccess}
        />,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(getByText('Target Bag 1')).toBeTruthy();
      });

      // Select a bag
      fireEvent.press(getByTestId('bag-item-bag-2'));

      // Press move button
      fireEvent.press(getByText('Move to Target Bag 1'));

      // Should call moveDiscBetweenBags with correct parameters
      await waitFor(() => {
        expect(moveDiscBetweenBags).toHaveBeenCalledWith(
          'bag-1',
          'bag-2',
          ['disc-1', 'disc-2'],
        );
      });

      // Should call onSuccess
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });
});
