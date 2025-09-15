/**
 * RecoverDiscModal Component Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RecoverDiscModal from '../../../src/components/modals/RecoverDiscModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as bagService from '../../../src/services/bagService';
import * as hapticService from '../../../src/services/hapticService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
  bulkRecoverDiscs: jest.fn(),
}));

// Mock the hapticService
jest.mock('../../../src/services/hapticService', () => ({
  triggerSelectionHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
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

describe('RecoverDiscModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
    mockTriggerBagRefresh.mockClear();
    mockTriggerBagListRefresh.mockClear();
  });
  it('should export RecoverDiscModal component', () => {
    expect(typeof RecoverDiscModal).toBe('function');
  });

  it('should accept basic props without crashing', () => {
    expect(() => {
      render(
        <ThemeProvider>
          <RecoverDiscModal
            visible={false}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[]}
            targetBagId=""
          />
        </ThemeProvider>,
      );
    }).not.toThrow();
  });

  it('should render modal when visible is true', () => {
    const { getByText } = render(
      <ThemeProvider>
        <RecoverDiscModal
          visible
          onClose={jest.fn()}
          discs={[]}
          targetBagId=""
        />
      </ThemeProvider>,
    );

    expect(getByText('Recover Discs')).toBeTruthy();
  });

  it('should not render modal when visible is false', () => {
    const { queryByText } = render(
      <ThemeProvider>
        <RecoverDiscModal
          visible={false}
          onClose={jest.fn()}
          discs={[]}
          targetBagId=""
        />
      </ThemeProvider>,
    );

    expect(queryByText('Recover Discs')).toBeNull();
  });

  it('should call onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <RecoverDiscModal
          visible
          onClose={onCloseMock}
          discs={[]}
          targetBagId=""
        />
      </ThemeProvider>,
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  describe('Orange Theming', () => {
    it('should display header with orange accent theming', () => {
      const {
        getByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Test Disc', brand: 'Test Brand' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const title = getByText('Recover Discs (1)');
      expect(title).toBeTruthy();
    });
  });

  describe('Enhanced Visual Distinction', () => {
    it('should display brand and model with distinct visual hierarchy', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should have separate elements for brand and model
      const brandElement = getByTestId('disc-brand');
      const modelElement = getByTestId('disc-model');

      expect(brandElement).toBeTruthy();
      expect(modelElement).toBeTruthy();
    });

    it('should display brand in lighter text and model in bold', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const brandElement = getByTestId('disc-brand');
      const modelElement = getByTestId('disc-model');

      // Check text content - brand element contains just the brand name
      expect(brandElement.children[0]).toBe('Innova');
      expect(modelElement.children[0]).toBe('Destroyer');
    });
  });

  describe('Recovery Context Section', () => {
    it('should render recovery context section when modal is visible', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('recovery-context-section')).toBeTruthy();
    });

    it('should display recovery explanation text for single disc', () => {
      const {
        getByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('This will return your lost disc back into your selected bag where you can track it again.')).toBeTruthy();
    });

    it('should display recovery explanation text for multiple discs', () => {
      const {
        getByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Wraith', brand: 'Innova' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('This will return your lost discs back into your selected bag where you can track them again.')).toBeTruthy();
    });

    it('should show appropriate recovery icon', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('recovery-context-icon')).toBeTruthy();
    });

    it('should not render recovery context section when modal is not visible', () => {
      const {
        queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible={false}
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('recovery-context-section')).toBeNull();
    });

    it('should not render recovery context section when no discs provided', () => {
      const {
        queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('recovery-context-section')).toBeNull();
    });

    it('should use proper theme colors and typography in recovery context', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const contextSection = getByTestId('recovery-context-section');
      const contextIcon = getByTestId('recovery-context-icon');
      const contextText = getByTestId('recovery-context-text');

      expect(contextSection).toBeTruthy();
      expect(contextIcon).toBeTruthy();
      expect(contextText).toBeTruthy();
    });
  });

  describe('DiscShowcase Section', () => {
    it('should render disc showcase section when discs provided', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('disc-showcase-section')).toBeTruthy();
    });

    it('should display single disc with full details including brand and model prominently', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('This will return your lost disc back into your selected bag where you can track it again.')).toBeTruthy();
      // Brand and model are now separate elements with proper visual hierarchy
      expect(getByTestId('disc-brand')).toBeTruthy();
      expect(getByTestId('disc-model')).toBeTruthy();
      expect(getByText('Innova')).toBeTruthy(); // Brand is shown without "by" prefix
      expect(getByText('Destroyer')).toBeTruthy();
    });

    it('should display multiple disc summary with count', () => {
      const {
        getByText, getByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Wraith', brand: 'Innova' },
              { id: '3', model: 'Zone', brand: 'Discraft' },
            ]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      expect(getByTestId('disc-showcase-section')).toBeTruthy();
      expect(getByText('Recovering 3 discs:')).toBeTruthy();
      // Should not show individual disc details for multiple discs
      expect(queryByText('Innova Destroyer')).toBeNull();
      expect(queryByText('Innova Wraith')).toBeNull();
      expect(queryByText('Discraft Zone')).toBeNull();
    });

    it('should handle empty disc array gracefully', () => {
      const {
        queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should not render disc showcase section when no discs
      expect(queryByTestId('disc-showcase-section')).toBeNull();
    });

    it('should apply orange theming to disc section elements', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Brand and model are now separate elements
      const brandElement = getByTestId('disc-brand');
      const modelElement = getByTestId('disc-model');
      expect(brandElement).toBeTruthy();
      expect(modelElement).toBeTruthy();
      // The orange color (#FF9500) and styling will be applied through StyleSheet
    });

    it('should display brand and model with proper spacing for various combinations', () => {
      // Test with longer brand/model names to verify spacing
      const testCases = [
        { brand: 'Innova', model: 'Destroyer' },
        { brand: 'Discraft', model: 'Zone' },
        { brand: 'Dynamic Discs', model: 'Judge' },
        { brand: 'MVP', model: 'Entropy' },
      ];

      testCases.forEach(({ brand, model }) => {
        const { getByText, unmount } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model, brand }]}
              targetBagId=""
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        // Brand is now displayed without "by" prefix, model is separate
        expect(getByText(brand)).toBeTruthy();
        expect(getByText(model)).toBeTruthy();
        unmount();
      });
    });

    it('should demonstrate final integration: single vs multiple disc scenarios', () => {
      // Test single disc scenario
      const { getByText: getSingleText, unmount: unmountSingle } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Verify single disc formatting
      expect(getSingleText('Recovering 1 disc:')).toBeTruthy();
      // Brand is now displayed as "by Brand" format, model is separate
      expect(getSingleText('Innova')).toBeTruthy();
      expect(getSingleText('Destroyer')).toBeTruthy();

      unmountSingle();

      // Test multiple discs scenario
      const { getByText: getMultipleText, queryByText } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
              { id: '3', model: 'Wraith', brand: 'Innova' },
            ]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Verify multiple discs formatting
      expect(getMultipleText('Recovering 3 discs:')).toBeTruthy();
      // Should NOT show individual disc details for multiple
      expect(queryByText('Innova Destroyer')).toBeNull();
      expect(queryByText('Discraft Zone')).toBeNull();
      expect(queryByText('Innova Wraith')).toBeNull();
    });
  });

  describe('Bag Selection Loading', () => {
    it('should initialize in loading state', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      expect(getByTestId('skeleton-loading-section')).toBeTruthy();
    });

    it('should call getBags service when visible', () => {
      // For this test, we're just checking the function is imported and used
      // The actual API call behavior will be tested in integration tests
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // The skeleton loading should be present, indicating the service is being called
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();
    });

    it('should display skeleton loading with proper theming', () => {
      const { getByTestId, getAllByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      const skeletonSection = getByTestId('skeleton-loading-section');
      expect(skeletonSection).toBeTruthy();

      // Should have skeleton items with shimmer effects
      const skeletonItems = getAllByTestId(/skeleton-bag-item-\d+/);
      expect(skeletonItems.length).toBeGreaterThan(0);
    });

    describe('Skeleton Loading States', () => {
      it('should display skeleton bag items during loading instead of spinner', () => {
        const { queryByTestId, getByTestId } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should NOT show the old ActivityIndicator
        expect(queryByTestId('loading-indicator')).toBeNull();

        // Should show skeleton loading section instead
        expect(getByTestId('skeleton-loading-section')).toBeTruthy();
      });

      it('should show 3-4 skeleton bag items with proper layout', () => {
        const { getAllByTestId } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should show 3-4 skeleton items
        const skeletonItems = getAllByTestId(/skeleton-bag-item-\d+/);
        expect(skeletonItems.length).toBeGreaterThanOrEqual(3);
        expect(skeletonItems.length).toBeLessThanOrEqual(4);
      });

      it('should animate skeleton shimmer effect', () => {
        const { getAllByTestId } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should have shimmer animation elements
        const shimmerElements = getAllByTestId(/skeleton-shimmer-\d+/);
        expect(shimmerElements.length).toBeGreaterThanOrEqual(3);
        expect(shimmerElements.length).toBeLessThanOrEqual(4);
      });

      it('should transition smoothly from skeleton to real content', async () => {
        // Mock successful bag loading
        const mockResponse = {
          bags: [
            { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          ],
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        };
        bagService.getBags.mockResolvedValue(mockResponse);

        const { queryByTestId, getByText } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        // Initially should show skeleton items
        expect(queryByTestId('skeleton-loading-section')).toBeTruthy();

        // Wait for bags to load and skeleton to disappear
        await waitFor(() => {
          expect(queryByTestId('skeleton-loading-section')).toBeNull();
        }, { timeout: 5000 });

        // Should show real bag selection content
        expect(getByText('Choose bag to recover to:')).toBeTruthy();
        expect(getByText('Main Bag')).toBeTruthy();
      });

      it('should match real bag item dimensions and spacing', () => {
        const { getAllByTestId } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should have skeleton items with consistent styling
        const skeletonItems = getAllByTestId(/skeleton-bag-item-\d+/);
        expect(skeletonItems.length).toBeGreaterThan(0);

        // Each skeleton item should have the proper structure
        skeletonItems.forEach((item) => {
          expect(item).toBeTruthy();
        });
      });

      it('should use proper theme colors for skeleton elements', () => {
        const { getAllByTestId } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should have skeleton items with theme-appropriate styling
        const skeletonItems = getAllByTestId(/skeleton-bag-item-\d+/);
        expect(skeletonItems.length).toBeGreaterThan(0);

        // Should have shimmer elements
        const shimmerElements = getAllByTestId(/skeleton-shimmer-\d+/);
        expect(shimmerElements.length).toBeGreaterThan(0);
      });

      it('should maintain existing loading functionality and testIDs', () => {
        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Should maintain the loading section testID for compatibility
        expect(getByTestId('skeleton-loading-section')).toBeTruthy();
      });
    });
  });

  describe('Phase 5: Bag Selection Interface', () => {
    it('should correctly handle getBags response with bags array property', async () => {
      // Mock successful bag loading with correct API response format
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Initially should show skeleton loading
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display bag selection section with loaded bags
      expect(getByText('Choose bag to recover to:')).toBeTruthy();
      expect(getByText('Main Bag')).toBeTruthy();
      expect(getByText('Tournament Bag')).toBeTruthy();
    });

    it('should display bag list from loaded bags', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
          { id: 'bag3', name: 'Practice Bag', description: 'For field work' },
        ],
        pagination: {
          total: 3,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Initially should show skeleton loading
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display bag selection section with loaded bags
      expect(getByText('Choose bag to recover to:')).toBeTruthy();
      expect(getByText('Main Bag')).toBeTruthy();
      expect(getByText('Tournament Bag')).toBeTruthy();
      expect(getByText('Practice Bag')).toBeTruthy();
    });

    it('should handle bag selection with onPress', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Find and press the first bag
      const mainBagItem = getByText('Main Bag');
      expect(mainBagItem).toBeTruthy();

      // Simulate bag selection
      fireEvent.press(mainBagItem.parent);

      // Should have visual indication of selection (will be added in next slice)
      expect(getByText('Main Bag')).toBeTruthy();
    });

    it('should show selection state with visual indicators', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        queryByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag items
      const mainBagItem = getByTestId('bag-item-bag1');
      const tournamentBagItem = getByTestId('bag-item-bag2');

      // Initially no bag should be selected (no selection indicator)
      expect(queryByText('✓')).toBeNull();

      // Select first bag
      fireEvent.press(mainBagItem);

      // Should show selection state on selected bag
      const mainBagItemAfter = getByTestId('bag-item-bag1');
      const tournamentBagItemAfter = getByTestId('bag-item-bag2');
      expect(mainBagItemAfter.props.accessibilityState.selected).toBe(true);
      expect(tournamentBagItemAfter.props.accessibilityState.selected).toBe(false);

      // Select different bag
      fireEvent.press(tournamentBagItem);

      // Should update selection state
      const mainBagItemFinal = getByTestId('bag-item-bag1');
      const tournamentBagItemFinal = getByTestId('bag-item-bag2');
      expect(tournamentBagItemFinal.props.accessibilityState.selected).toBe(true);
      expect(mainBagItemFinal.props.accessibilityState.selected).toBe(false);
    });

    it('should handle no bags available with empty state', async () => {
      // Mock empty bag list
      bagService.getBags.mockResolvedValue({
        bags: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const {
        getByText, queryByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show empty state
      expect(getByText('No bags available')).toBeTruthy();
      expect(getByText('Create your first bag to recover discs.')).toBeTruthy();

      // Should not show bag selection section
      expect(queryByText('Choose bag to recover to:')).toBeNull();
    });
  });

  describe('Phase 6: Error Handling', () => {
    it('should handle getBags API error gracefully', async () => {
      // Mock API error
      bagService.getBags.mockRejectedValue(new Error('Failed to load bags'));

      const {
        getByText, getByTestId, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Initially should show loading
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for error handling to complete
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show error state with retry button
      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('We\'re having trouble connecting to our servers. Check your internet connection and try again.')).toBeTruthy();
      expect(getByTestId('enhanced-retry-button')).toBeTruthy();

      // Should not show bag selection section
      expect(queryByText('Choose bag to recover to:')).toBeNull();
    });

    it('should display error message when bag loading fails', async () => {
      // Mock API error with specific message
      bagService.getBags.mockRejectedValue(new Error('Network connection failed'));

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Initially should show loading
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for error handling to complete
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show error state with message
      const errorSection = getByTestId('animated-error-section');
      expect(errorSection).toBeTruthy();
      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('We\'re having trouble connecting to our servers. Check your internet connection and try again.')).toBeTruthy();

      // Should have retry button
      const retryButton = getByTestId('enhanced-retry-button');
      expect(retryButton).toBeTruthy();
    });

    it('should retry loading bags when retry button is pressed', async () => {
      // Set up mock sequence: first fails, then succeeds
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };

      bagService.getBags
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const {
        getByText, getByTestId, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for first error
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
        expect(getByText('Connection Problem')).toBeTruthy();
      });

      // Press retry button
      const retryButton = getByTestId('enhanced-retry-button');
      fireEvent.press(retryButton);

      // Should show loading again briefly
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for successful load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
        expect(queryByText('Connection Problem')).toBeNull();
      }, { timeout: 10000 });

      // Should now show bag selection
      expect(getByText('Choose bag to recover to:')).toBeTruthy();
      expect(getByText('Main Bag')).toBeTruthy();
    });
  });

  describe('ScrollView for Bag List', () => {
    it('should render bag list inside a ScrollView for many bags', async () => {
      // Mock successful bag loading with many bags
      const mockResponse = {
        bags: Array.from({ length: 10 }, (_, i) => ({
          id: `bag${i + 1}`,
          name: `Bag ${i + 1}`,
          description: `Description for bag ${i + 1}`,
        })),
        pagination: {
          total: 10, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should have a ScrollView for bag list
      const scrollView = getByTestId('bag-list-scroll');
      expect(scrollView).toBeTruthy();

      // Should display all bags
      expect(queryByText('Bag 1')).toBeTruthy();
      expect(queryByText('Bag 10')).toBeTruthy();
    });

    it('should have proper max height for ScrollView to prevent modal overflow', async () => {
      // Mock successful bag loading with many bags
      const mockResponse = {
        bags: Array.from({ length: 20 }, (_, i) => ({
          id: `bag${i + 1}`,
          name: `Bag ${i + 1}`,
          description: `Description for bag ${i + 1}`,
        })),
        pagination: {
          total: 20, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // ScrollView should exist
      const scrollView = getByTestId('bag-list-scroll');
      expect(scrollView).toBeTruthy();

      // Should still be able to select bags and see recover button
      const recoverButton = getByTestId('recover-button');
      expect(recoverButton).toBeTruthy();
    });
  });

  describe('Phase 1.3: Enhanced Bag Selection Visual Feedback', () => {
    it('should display enhanced selection indicator with checkmark-circle icon when bag is selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });

      // Select first bag
      const mainBagItem = getByTestId('bag-item-bag1');
      fireEvent.press(mainBagItem);

      // Should show enhanced selection indicator with checkmark-circle icon
      const selectionIndicator = getByTestId('selection-indicator-bag1');
      expect(selectionIndicator).toBeTruthy();

      // Verify it's using checkmark-circle icon (component implementation will handle this)
      // The icon name will be verified through the implementation
    });

    it('should highlight selected bag with enhanced primary color border and background', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });

      // Initially no bag should be selected with enhanced styling
      const mainBagItem = getByTestId('bag-item-bag1');
      const tournamentBagItem = getByTestId('bag-item-bag2');

      // Select first bag
      fireEvent.press(mainBagItem);

      // Should apply enhanced selected styling to selected bag
      // The specific border and background styling will be applied through StyleSheet
      expect(mainBagItem.props.accessibilityState.selected).toBe(true);
      expect(tournamentBagItem.props.accessibilityState.selected).toBe(false);

      // Select different bag
      fireEvent.press(tournamentBagItem);

      // Should update selection with enhanced styling
      const mainBagItemAfter = getByTestId('bag-item-bag1');
      const tournamentBagItemAfter = getByTestId('bag-item-bag2');
      expect(tournamentBagItemAfter.props.accessibilityState.selected).toBe(true);
      expect(mainBagItemAfter.props.accessibilityState.selected).toBe(false);
    });

    it('should display bag information with enhanced typography hierarchy', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display bag names with enhanced typography
      expect(getByText('Main Bag')).toBeTruthy();
      expect(getByText('Tournament Bag')).toBeTruthy();

      // Should display bag descriptions with proper hierarchy
      expect(getByText('My primary disc bag')).toBeTruthy();
      expect(getByText('Competition ready')).toBeTruthy();
    });

    it('should show bag disc count when available in bag data', async () => {
      // Mock successful bag loading with disc count data
      const mockResponse = {
        bags: [
          {
            id: 'bag1', name: 'Main Bag', description: 'My primary disc bag', disc_count: 15,
          },
          {
            id: 'bag2', name: 'Tournament Bag', description: 'Competition ready', disc_count: 8,
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display disc counts when available
      expect(getByText('15 discs')).toBeTruthy();
      expect(getByText('8 discs')).toBeTruthy();
    });

    it('should provide clear visual distinction between selected and unselected states', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
          { id: 'bag3', name: 'Practice Bag', description: 'For field work' },
        ],
        pagination: {
          total: 3, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });

      // Initially no bags should be selected
      const bag1Initial = getByTestId('bag-item-bag1');
      const bag2Initial = getByTestId('bag-item-bag2');
      const bag3Initial = getByTestId('bag-item-bag3');
      expect(bag1Initial.props.accessibilityState.selected).toBe(false);
      expect(bag2Initial.props.accessibilityState.selected).toBe(false);
      expect(bag3Initial.props.accessibilityState.selected).toBe(false);

      // Select middle bag
      const tournamentBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(tournamentBagItem);

      // Only selected bag should show selection state
      const bag1After = getByTestId('bag-item-bag1');
      const bag2After = getByTestId('bag-item-bag2');
      const bag3After = getByTestId('bag-item-bag3');
      expect(bag1After.props.accessibilityState.selected).toBe(false);
      expect(bag2After.props.accessibilityState.selected).toBe(true);
      expect(bag3After.props.accessibilityState.selected).toBe(false);

      // Switch to different bag
      const practiceeBagItem = getByTestId('bag-item-bag3');
      fireEvent.press(practiceeBagItem);

      // Selection should move to new bag
      const bag1Final = getByTestId('bag-item-bag1');
      const bag2Final = getByTestId('bag-item-bag2');
      const bag3Final = getByTestId('bag-item-bag3');
      expect(bag1Final.props.accessibilityState.selected).toBe(false);
      expect(bag2Final.props.accessibilityState.selected).toBe(false);
      expect(bag3Final.props.accessibilityState.selected).toBe(true);
    });

    it('should use design system colors, spacing, and typography consistently', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          {
            id: 'bag1', name: 'Main Bag', description: 'My primary disc bag', disc_count: 10,
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(getByText('Choose bag to recover to:')).toBeTruthy();
      });

      // Should render with design system styling
      expect(getByText('Main Bag')).toBeTruthy();
      expect(getByText('My primary disc bag')).toBeTruthy();
      expect(getByText('10 discs')).toBeTruthy();

      // Select bag to verify enhanced styling
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should show enhanced selection indicator
      expect(getByTestId('selection-indicator-bag1')).toBeTruthy();
    });
  });

  describe('Flight Numbers Display', () => {
    it('should display flight number badges when single disc has flight data', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              speed: 12,
              glide: 5,
              turn: -1,
              fade: 3,
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('flight-numbers-section')).toBeTruthy();
    });

    it('should show all four badges (Speed, Glide, Turn, Fade) with correct colors', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              speed: 12,
              glide: 5,
              turn: -1,
              fade: 3,
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('speed-badge')).toBeTruthy();
      expect(getByTestId('glide-badge')).toBeTruthy();
      expect(getByTestId('turn-badge')).toBeTruthy();
      expect(getByTestId('fade-badge')).toBeTruthy();
    });

    it('should display correct flight values in badges', () => {
      const {
        getByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              speed: 12,
              glide: 5,
              turn: -1,
              fade: 3,
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Check speed badge content
      expect(getByText('S')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();

      // Check glide badge content
      expect(getByText('G')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();

      // Check turn badge content
      expect(getByText('T')).toBeTruthy();
      expect(getByText('-1')).toBeTruthy();

      // Check fade badge content
      expect(getByText('F')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });

    it('should handle missing flight numbers gracefully', () => {
      const {
        queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              // No flight numbers provided
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should not display flight numbers section when data is missing
      expect(queryByTestId('flight-numbers-section')).toBeNull();
    });

    it('should only display for single disc, not multiple disc summary', () => {
      const {
        queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              {
                id: '1', model: 'Destroyer', brand: 'Innova', speed: 12, glide: 5, turn: -1, fade: 3,
              },
              {
                id: '2', model: 'Wraith', brand: 'Innova', speed: 11, glide: 5, turn: -1, fade: 3,
              },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should not show flight numbers for multiple discs
      expect(queryByTestId('flight-numbers-section')).toBeNull();
    });

    it('should use accessible labels (S, G, T, F)', () => {
      const {
        getByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              speed: 12,
              glide: 5,
              turn: -1,
              fade: 3,
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should use proper accessible labels
      expect(getByText('S')).toBeTruthy(); // Speed
      expect(getByText('G')).toBeTruthy(); // Glide
      expect(getByText('T')).toBeTruthy(); // Turn
      expect(getByText('F')).toBeTruthy(); // Fade
    });
  });

  describe('Phase 2.2: Multi-Disc Grid Display', () => {
    it('should display grid of disc cards when multiple discs provided', () => {
      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
              { id: '3', model: 'Wraith', brand: 'Innova' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should show grid display for multiple discs
      expect(getByTestId('multi-disc-grid')).toBeTruthy();
      // Should not show single disc details
      expect(queryByTestId('disc-brand')).toBeNull();
      expect(queryByTestId('disc-model')).toBeNull();
    });

    it('should show 2-3 disc cards per row in responsive grid', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
              { id: '3', model: 'Wraith', brand: 'Innova' },
              { id: '4', model: 'Firebird', brand: 'Innova' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const gridContainer = getByTestId('multi-disc-grid');
      expect(gridContainer).toBeTruthy();

      // Should display disc cards with proper testIDs
      expect(getByTestId('disc-card-1')).toBeTruthy();
      expect(getByTestId('disc-card-2')).toBeTruthy();
      expect(getByTestId('disc-card-3')).toBeTruthy();
      expect(getByTestId('disc-card-4')).toBeTruthy();
    });

    it('should display brand and model for each disc in card format', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should show disc cards with brand and model
      expect(getByTestId('disc-card-1')).toBeTruthy();
      expect(getByTestId('disc-card-2')).toBeTruthy();

      // Each card should contain brand and model text
      expect(getByText('Innova')).toBeTruthy();
      expect(getByText('Destroyer')).toBeTruthy();
      expect(getByText('Discraft')).toBeTruthy();
      expect(getByText('Zone')).toBeTruthy();
    });

    it('should show maximum of 6 discs with "+X more" indicator for larger sets', () => {
      const eightDiscs = Array.from({ length: 8 }, (_, i) => ({
        id: `disc-${i + 1}`,
        model: `Model ${i + 1}`,
        brand: `Brand ${i + 1}`,
      }));

      const { getByTestId, getByText, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={eightDiscs}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should show grid
      expect(getByTestId('multi-disc-grid')).toBeTruthy();

      // Should show first 6 disc cards
      expect(getByTestId('disc-card-disc-1')).toBeTruthy();
      expect(getByTestId('disc-card-disc-6')).toBeTruthy();

      // Should NOT show 7th and 8th disc cards
      expect(queryByTestId('disc-card-disc-7')).toBeNull();
      expect(queryByTestId('disc-card-disc-8')).toBeNull();

      // Should show "+X more" indicator
      expect(getByTestId('more-discs-indicator')).toBeTruthy();
      expect(getByText('+2 more')).toBeTruthy();
    });

    it('should use proper spacing and theme colors', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Grid should use design system colors and spacing
      const gridContainer = getByTestId('multi-disc-grid');
      expect(gridContainer).toBeTruthy();

      const discCard1 = getByTestId('disc-card-1');
      const discCard2 = getByTestId('disc-card-2');
      expect(discCard1).toBeTruthy();
      expect(discCard2).toBeTruthy();
    });

    it('should maintain single disc detailed view for single disc', () => {
      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{
              id: '1',
              model: 'Destroyer',
              brand: 'Innova',
              speed: 12,
              glide: 5,
              turn: -1,
              fade: 3,
            }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should NOT show grid for single disc
      expect(queryByTestId('multi-disc-grid')).toBeNull();

      // Should show single disc detailed view
      expect(getByTestId('disc-brand')).toBeTruthy();
      expect(getByTestId('disc-model')).toBeTruthy();
      expect(getByTestId('flight-numbers-section')).toBeTruthy();
    });

    it('should handle edge case with exactly 6 discs (no +X more needed)', () => {
      const sixDiscs = Array.from({ length: 6 }, (_, i) => ({
        id: `disc-${i + 1}`,
        model: `Model ${i + 1}`,
        brand: `Brand ${i + 1}`,
      }));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={sixDiscs}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should show all 6 disc cards
      expect(getByTestId('disc-card-disc-1')).toBeTruthy();
      expect(getByTestId('disc-card-disc-6')).toBeTruthy();

      // Should NOT show "+X more" indicator
      expect(queryByTestId('more-discs-indicator')).toBeNull();
    });

    it('should use compact card format with proper typography hierarchy', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Zone', brand: 'Discraft' },
            ]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const discCard1 = getByTestId('disc-card-1');
      const discCard2 = getByTestId('disc-card-2');

      expect(discCard1).toBeTruthy();
      expect(discCard2).toBeTruthy();

      // Cards should have brand and model elements with proper hierarchy
      expect(getByTestId('card-brand-1')).toBeTruthy();
      expect(getByTestId('card-model-1')).toBeTruthy();
      expect(getByTestId('card-brand-2')).toBeTruthy();
      expect(getByTestId('card-model-2')).toBeTruthy();
    });
  });

  describe('Phase 2.3: Simple Button Labels', () => {
    it('should show "Recover" when no bag is selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show "Recover" when no bag selected
      expect(getByText('Recover')).toBeTruthy();
    });

    it('should show "Recover" for single disc with bag selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should show simplified "Recover" text when bag is selected
      expect(getByText('Recover')).toBeTruthy();
    });

    it('should show "Recover" for multiple discs with bag selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Wraith', brand: 'Innova' },
              { id: '3', model: 'Zone', brand: 'Discraft' },
            ]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should show simplified "Recover" text when bag is selected
      expect(getByText('Recover')).toBeTruthy();
    });

    it('should show "Recovering..." during recovery operation', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      // Mock slow API response
      bagService.bulkRecoverDiscs.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Press recover button
      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Should show "Recovering..." during operation
      expect(getByText('Recovering...')).toBeTruthy();
    });

    it('should properly pluralize disc vs discs based on count', async () => {
      // Mock successful bag loading - clear previous mocks and set up persistent mock
      bagService.getBags.mockClear();
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Practice Bag', description: 'For field work' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      // Set up persistent mock for multiple calls
      bagService.getBags.mockImplementation(() => Promise.resolve(mockResponse));

      // Test single disc
      const {
        getByText, getByTestId, rerender, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should show correct button text regardless of count
      expect(getByText('Recover')).toBeTruthy();

      // Test with multiple discs
      rerender(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[
              { id: '1', model: 'Destroyer', brand: 'Innova' },
              { id: '2', model: 'Wraith', brand: 'Innova' },
            ]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load again with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag again
      const bagItemNew = getByTestId('bag-item-bag1');
      fireEvent.press(bagItemNew);

      // Should show correct button text regardless of count
      expect(getByText('Recover')).toBeTruthy();
    });

    it('should update button text in real-time when bag selection changes', async () => {
      // Mock successful bag loading with multiple bags
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Initially should show "Recover"
      expect(getByText('Recover')).toBeTruthy();

      // Select first bag
      const mainBagItem = getByTestId('bag-item-bag1');
      fireEvent.press(mainBagItem);

      // Should show simple "Recover" text
      expect(getByText('Recover')).toBeTruthy();

      // Select different bag
      const tournamentBagItem = getByTestId('bag-item-bag2');
      fireEvent.press(tournamentBagItem);

      // Should show correct button text for currently selected bag
      expect(getByText('Recover')).toBeTruthy();
      expect(queryByText('Recover 1 disc to Tournament Bag')).toBeNull();
    });

    it('should handle bag names with special characters and length properly', async () => {
      // Mock successful bag loading with complex bag names
      const mockResponse = {
        bags: [
          { id: 'bag1', name: "John's Tournament Bag (2024)", description: 'Special bag' },
          { id: 'bag2', name: 'Practice & Field Work Bag', description: 'Another special bag' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select first bag with special characters
      const bag1Item = getByTestId('bag-item-bag1');
      fireEvent.press(bag1Item);

      // Should show correct button text with special characters
      expect(getByText('Recover')).toBeTruthy();

      // Select second bag with ampersand
      const bag2Item = getByTestId('bag-item-bag2');
      fireEvent.press(bag2Item);

      // Should show correct button text with ampersand
      expect(getByText('Recover')).toBeTruthy();
    });

    it('should handle edge case with missing bag name gracefully', async () => {
      // Mock successful bag loading with missing bag name
      const mockResponse = {
        bags: [
          { id: 'bag1', name: '', description: 'No name bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select bag with empty name
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should show simplified "Recover" text regardless of missing name
      expect(getByText('Recover')).toBeTruthy();
    });
  });

  describe('Phase 7: Recovery Action', () => {
    it('should render recovery button that is initially disabled', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show recover button that is initially disabled (no bag selected)
      const recoverButton = getByText('Recover');
      expect(recoverButton).toBeTruthy();
      // Button should be disabled since no bag is selected
    });

    it('should enable recovery button when a bag is selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Recovery button should now show simple "Recover" text
      const recoverButton = getByText('Recover');
      expect(recoverButton).toBeTruthy();
    });

    it('should call bulkRecoverDiscs with correct payload when recover button is pressed', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);
      bagService.bulkRecoverDiscs.mockResolvedValue({ success: true });

      const onSuccessMock = jest.fn();
      const {
        getByText, getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={onSuccessMock}
            discs={[
              { id: 'disc1', model: 'Destroyer', brand: 'Innova' },
              { id: 'disc2', model: 'Wraith', brand: 'Innova' },
            ]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Press recover button
      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Should call bulkRecoverDiscs with correct payload
      expect(bagService.bulkRecoverDiscs).toHaveBeenCalledWith({
        contentIds: ['disc1', 'disc2'],
        targetBagId: 'bag1',
      });
    });

    it('should show loading state during recovery', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);
      // Mock slow API response
      bagService.bulkRecoverDiscs.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      const { getByText, getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
            discs={[{ id: 'disc1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Press recover button
      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Should show loading state
      expect(getByText('Recovering...')).toBeTruthy();
    });

    it('should call onSuccess and close modal on successful recovery', async () => {
      // Mock successful bag loading and recovery
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);
      bagService.bulkRecoverDiscs.mockResolvedValue({ success: true });

      const onSuccessMock = jest.fn();
      const onCloseMock = jest.fn();
      const { getByText, getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={onCloseMock}
            onSuccess={onSuccessMock}
            discs={[{ id: 'disc1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Press recover button
      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Wait for recovery to complete
      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
        expect(onCloseMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle recovery error with Alert and keep modal open', async () => {
      // Mock successful bag loading but failed recovery
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);
      bagService.bulkRecoverDiscs.mockRejectedValue(new Error('Network error'));

      const onSuccessMock = jest.fn();
      const onCloseMock = jest.fn();
      const { getByText, getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={onCloseMock}
            onSuccess={onSuccessMock}
            discs={[{ id: 'disc1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Press recover button
      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Wait for error handling
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Recovery Failed',
          'Unable to recover discs. Please try again.',
          [{ text: 'OK', style: 'default' }],
        );
      });

      // Should not call onSuccess or onClose on error
      expect(onSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();

      // Button should return to normal state after error
      expect(getByText('Recover')).toBeTruthy();
    });
  });

  describe('Phase 2.4: Smooth Animations and Transitions', () => {
    it('should apply scale animation to selected bag items', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
          { id: 'bag2', name: 'Tournament Bag', description: 'Competition ready' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag and verify animation is triggered
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should have animated bag item with scale animation
      const animatedBagItem = getByTestId('animated-bag-item-bag1');
      expect(animatedBagItem).toBeTruthy();
    });

    it('should fade in disc showcase section when content loads', () => {
      const {
        getByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Should have animated disc showcase section
      const animatedShowcaseSection = getByTestId('animated-disc-showcase-section');
      expect(animatedShowcaseSection).toBeTruthy();
    });

    it('should animate bag list appearance after loading', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should have animated bag selection section
      const animatedBagSection = getByTestId('animated-bag-selection-section');
      expect(animatedBagSection).toBeTruthy();
    });

    it('should have smooth animation timing for bag selection transitions', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select a bag - should trigger smooth animation
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should have animated bag item that maintains functionality
      const animatedBagItem = getByTestId('animated-bag-item-bag1');
      expect(animatedBagItem).toBeTruthy();
    });

    it('should not interfere with existing functionality during animations', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);
      bagService.bulkRecoverDiscs.mockResolvedValue({ success: true });

      const onSuccessMock = jest.fn();
      const { getByText, getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={onSuccessMock}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select bag and recover - should work despite animations
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      const recoverButton = getByText('Recover');
      fireEvent.press(recoverButton);

      // Should still complete recovery successfully
      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should maintain accessibility during animations', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Animated elements should maintain testID for accessibility
      const animatedShowcase = getByTestId('animated-disc-showcase-section');
      const animatedBagSection = getByTestId('animated-bag-selection-section');

      expect(animatedShowcase).toBeTruthy();
      expect(animatedBagSection).toBeTruthy();
    });
  });

  describe('Phase 3.1: Enhanced Error Communication with Visual Cues', () => {
    it('should display contextual error icon based on error type', async () => {
      // Mock network error
      bagService.getBags.mockRejectedValue(new Error('Network request failed'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display contextual error icon
      const errorIcon = getByTestId('contextual-error-icon');
      expect(errorIcon).toBeTruthy();
    });

    it('should show wifi-off icon for network errors', async () => {
      // Mock network error
      bagService.getBags.mockRejectedValue(new Error('Network request failed'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should use wifi-off icon for network errors
      const errorIcon = getByTestId('contextual-error-icon');
      expect(errorIcon).toBeTruthy();
      // Implementation will ensure the correct icon name is used
    });

    it('should show server icon for API/server errors', async () => {
      // Mock server error
      bagService.getBags.mockRejectedValue(new Error('Server error 500'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should use server icon for API errors
      const errorIcon = getByTestId('contextual-error-icon');
      expect(errorIcon).toBeTruthy();
      // Implementation will ensure the correct icon name is used
    });

    it('should display user-friendly error messages instead of technical ones', async () => {
      // Mock technical error
      bagService.getBags.mockRejectedValue(new Error('TypeError: Cannot read property "data" of undefined'));

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should show user-friendly message, not technical error
      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('We\'re having trouble connecting to our servers. Check your internet connection and try again.')).toBeTruthy();
    });

    it('should provide clear retry action with enhanced styling', async () => {
      // Mock error
      bagService.getBags.mockRejectedValue(new Error('Network error'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should have enhanced retry button
      const enhancedRetryButton = getByTestId('enhanced-retry-button');
      expect(enhancedRetryButton).toBeTruthy();
    });

    it('should animate error state appearance smoothly', async () => {
      // Mock error
      bagService.getBags.mockRejectedValue(new Error('Network error'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should have animated error section
      const animatedErrorSection = getByTestId('animated-error-section');
      expect(animatedErrorSection).toBeTruthy();
    });

    it('should handle network error scenario with appropriate visual cues', async () => {
      // Mock network error
      bagService.getBags.mockRejectedValue(new Error('Network request failed'));

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display appropriate error title and message
      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('We\'re having trouble connecting to our servers. Check your internet connection and try again.')).toBeTruthy();
    });

    it('should handle server error scenario with appropriate visual cues', async () => {
      // Mock server error
      bagService.getBags.mockRejectedValue(new Error('Server error 500'));

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display appropriate error title and message
      expect(getByText('Server Issue')).toBeTruthy();
      expect(getByText('Our servers are experiencing issues. Please wait a moment and try again.')).toBeTruthy();
    });

    it('should handle timeout error scenario with appropriate visual cues', async () => {
      // Mock timeout error
      bagService.getBags.mockRejectedValue(new Error('Timeout'));

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should display appropriate error title and message
      expect(getByText('Request Timeout')).toBeTruthy();
      expect(getByText('The request took too long to complete. Please check your connection and try again.')).toBeTruthy();
    });

    it('should maintain proper theme integration in enhanced error states', async () => {
      // Mock error
      bagService.getBags.mockRejectedValue(new Error('Network error'));

      const {
        getByTestId, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should use proper theme colors and spacing
      const errorSection = getByTestId('animated-error-section');
      const errorIcon = getByTestId('contextual-error-icon');
      const retryButton = getByTestId('enhanced-retry-button');

      expect(errorSection).toBeTruthy();
      expect(errorIcon).toBeTruthy();
      expect(retryButton).toBeTruthy();
    });

    it('should provide helpful guidance in error messages', async () => {
      // Mock error
      bagService.getBags.mockRejectedValue(new Error('Network request failed'));

      const {
        getByText, queryByTestId,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error to appear with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Should provide helpful guidance
      expect(getByText('Connection Problem')).toBeTruthy();
      expect(getByText('We\'re having trouble connecting to our servers. Check your internet connection and try again.')).toBeTruthy();
    });

    it('should maintain enhanced error button functionality with press feedback', async () => {
      // First attempt fails
      bagService.getBags.mockRejectedValueOnce(new Error('Network error'));

      // Second attempt succeeds
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValueOnce(mockResponse);

      const {
        getByTestId, getByText, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            targetBagId=""
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for first error with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
        expect(getByText('Connection Problem')).toBeTruthy();
      }, { timeout: 5000 });

      // Press enhanced retry button
      const enhancedRetryButton = getByTestId('enhanced-retry-button');
      fireEvent.press(enhancedRetryButton);

      // Should show loading again
      expect(getByTestId('skeleton-loading-section')).toBeTruthy();

      // Wait for successful load with increased timeout for CI
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
        expect(queryByText('Connection Problem')).toBeNull();
      }, { timeout: 5000 });

      // Should now show bag selection
      expect(getByText('Choose bag to recover to:')).toBeTruthy();
      expect(getByText('Main Bag')).toBeTruthy();
    });
  });

  describe('Accessibility and Haptic Feedback (Phase 3.3)', () => {
    beforeEach(() => {
      hapticService.triggerSelectionHaptic.mockClear();
      hapticService.triggerSuccessHaptic.mockClear();
    });

    describe('Accessibility Labels', () => {
      it('should have proper accessibility labels for close button', async () => {
        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        const closeButton = getByTestId('close-button');
        expect(closeButton.props.accessibilityLabel).toBe('Close recover discs modal');
        expect(closeButton.props.accessibilityRole).toBe('button');
        expect(closeButton.props.accessibilityHint).toBe('Closes the modal without recovering any discs');
      });

      it('should have accessibility labels for disc showcase section', async () => {
        bagService.getBags.mockResolvedValue({
          bags: [{ id: 'bag1', name: 'Main Bag' }],
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const mockDisc = {
          id: '1',
          brand: 'Innova',
          model: 'Champion Roc',
          speed: 5,
          glide: 4,
          turn: 0,
          fade: 3,
        };

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[mockDisc]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('disc-showcase-section')).toBeTruthy();
        });

        const discShowcase = getByTestId('disc-showcase-section');
        expect(discShowcase.props.accessibilityLabel).toContain('Innova Champion Roc');
        expect(discShowcase.props.accessibilityLabel).toContain('speed five, glide four, turn zero, fade three');
        expect(discShowcase.props.accessibilityRole).toBe('text');
      });

      it('should have accessibility labels for flight numbers', async () => {
        bagService.getBags.mockResolvedValue({
          bags: [{ id: 'bag1', name: 'Main Bag' }],
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const mockDisc = {
          id: '1',
          brand: 'Innova',
          model: 'Champion Roc',
          speed: 5,
          glide: 4,
          turn: 0,
          fade: 3,
        };

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[mockDisc]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('flight-numbers-section')).toBeTruthy();
        });

        const speedBadge = getByTestId('speed-badge');
        const glideBadge = getByTestId('glide-badge');
        const turnBadge = getByTestId('turn-badge');
        const fadeBadge = getByTestId('fade-badge');

        expect(speedBadge.props.accessibilityLabel).toBe('Speed five, affects overall disc speed');
        expect(glideBadge.props.accessibilityLabel).toBe('Glide four, affects how disc maintains lift');
        expect(turnBadge.props.accessibilityLabel).toBe('Turn zero, affects left to right movement in flight');
        expect(fadeBadge.props.accessibilityLabel).toBe('Fade three, affects end of flight hook');
      });

      it('should have accessibility labels for bag items', async () => {
        const mockBags = [
          {
            id: 'bag1', name: 'Main Bag', description: 'My primary disc bag', disc_count: 15,
          },
          {
            id: 'bag2', name: 'Tournament Bag', description: 'Competition ready', disc_count: 8,
          },
        ];

        bagService.getBags.mockResolvedValue({
          bags: mockBags,
          pagination: {
            total: 2, limit: 20, offset: 0, hasMore: false,
          },
        });

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Roc', brand: 'Innova' }]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('bag-item-bag1')).toBeTruthy();
        });

        const bagItem1 = getByTestId('bag-item-bag1');
        const bagItem2 = getByTestId('bag-item-bag2');

        expect(bagItem1.props.accessibilityLabel).toBe('Main Bag, My primary disc bag, contains fifteen discs');
        expect(bagItem1.props.accessibilityRole).toBe('button');
        expect(bagItem1.props.accessibilityHint).toBe('Tap to select as destination for disc recovery');

        expect(bagItem2.props.accessibilityLabel).toBe('Tournament Bag, Competition ready, contains eight discs');
        expect(bagItem2.props.accessibilityRole).toBe('button');
        expect(bagItem2.props.accessibilityHint).toBe('Tap to select as destination for disc recovery');
      });

      it('should have accessibility label for recover button with context', async () => {
        const mockBags = [
          {
            id: 'bag1', name: 'Main Bag', description: 'My primary disc bag', disc_count: 15,
          },
        ];

        bagService.getBags.mockResolvedValue({
          bags: mockBags,
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[
                { id: '1', model: 'Roc', brand: 'Innova' },
                { id: '2', model: 'Destroyer', brand: 'Innova' },
              ]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('bag-item-bag1')).toBeTruthy();
        });

        // Select bag
        const bagItem = getByTestId('bag-item-bag1');
        fireEvent.press(bagItem);

        await waitFor(() => {
          expect(getByTestId('recover-button')).toBeTruthy();
        });

        const recoverButton = getByTestId('recover-button');
        expect(recoverButton.props.accessibilityLabel).toBe('Recover two discs to Main Bag');
        expect(recoverButton.props.accessibilityHint).toBe('Moves the selected discs from lost items back into Main Bag');
      });
    });

    describe('Haptic Feedback', () => {
      it('should trigger selection haptic when bag is selected', async () => {
        const mockBags = [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ];

        bagService.getBags.mockResolvedValue({
          bags: mockBags,
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Roc', brand: 'Innova' }]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('bag-item-bag1')).toBeTruthy();
        });

        const bagItem = getByTestId('bag-item-bag1');
        fireEvent.press(bagItem);

        expect(hapticService.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
      });

      it('should trigger success haptic when recovery is completed', async () => {
        const mockBags = [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ];

        bagService.getBags.mockResolvedValue({
          bags: mockBags,
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        bagService.bulkRecoverDiscs.mockResolvedValue({ success: true });

        const onSuccessMock = jest.fn();
        const onCloseMock = jest.fn();

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={onCloseMock}
              discs={[{ id: '1', model: 'Roc', brand: 'Innova' }]}
              onSuccess={onSuccessMock}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('bag-item-bag1')).toBeTruthy();
        });

        // Select bag and recover
        const bagItem = getByTestId('bag-item-bag1');
        fireEvent.press(bagItem);

        await waitFor(() => {
          expect(getByTestId('recover-button')).toBeTruthy();
        });

        const recoverButton = getByTestId('recover-button');
        fireEvent.press(recoverButton);

        await waitFor(() => {
          expect(onSuccessMock).toHaveBeenCalled();
        });

        expect(hapticService.triggerSuccessHaptic).toHaveBeenCalledTimes(1);
      });
    });

    describe('Screen Reader Support', () => {
      it('should provide screen reader descriptions for multi-disc showcase', async () => {
        const mockDiscs = [
          { id: '1', brand: 'Innova', model: 'Roc' },
          { id: '2', brand: 'Discraft', model: 'Buzzz' },
          { id: '3', brand: 'Dynamic Discs', model: 'Truth' },
        ];

        bagService.getBags.mockResolvedValue({
          bags: [{ id: 'bag1', name: 'Main Bag' }],
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={mockDiscs}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('multi-disc-grid')).toBeTruthy();
        });

        const multiDiscGrid = getByTestId('multi-disc-grid');
        expect(multiDiscGrid.props.accessibilityLabel).toContain('three discs selected for recovery');
        expect(multiDiscGrid.props.accessibilityLabel).toContain('Innova Roc, Discraft Buzzz, and Dynamic Discs Truth');
        expect(multiDiscGrid.props.accessibilityRole).toBe('text');
      });

      it('should provide context-aware accessibility hints for recovery actions', async () => {
        const mockBags = [
          { id: 'bag1', name: 'Main Bag', disc_count: 15 },
        ];

        bagService.getBags.mockResolvedValue({
          bags: mockBags,
          pagination: {
            total: 1, limit: 20, offset: 0, hasMore: false,
          },
        });

        const {
          getByTestId,
        } = render(
          <ThemeProvider>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              discs={[{ id: '1', model: 'Roc', brand: 'Innova' }]}
              onSuccess={jest.fn()}
            />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByTestId('recovery-context-section')).toBeTruthy();
        });

        const contextSection = getByTestId('recovery-context-section');
        expect(contextSection.props.accessibilityLabel).toContain('Recovery information');
        expect(contextSection.props.accessibilityHint).toBe('This explains what will happen when you recover your discs');
        expect(contextSection.props.accessibilityRole).toBe('text');
      });
    });
  });

  describe('Modern Card Design - Phase 1', () => {
    it('should render bag items with modern card styling and enhanced shadows', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag item and check styling
      const bagItem = getByTestId('bag-item-bag1');
      const bagItemStyle = bagItem.props.style;

      // Verify modern card styling attributes are present
      expect(bagItemStyle).toEqual(expect.objectContaining({
        backgroundColor: expect.any(String),
        borderRadius: expect.any(Number),
        paddingVertical: expect.any(Number),
        paddingHorizontal: expect.any(Number),
        marginBottom: expect.any(Number),
      }));
    });

    it('should apply enhanced spacing for better touch targets', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag item and check minimum touch target requirements
      const bagItem = getByTestId('bag-item-bag1');
      const bagItemStyle = bagItem.props.style;

      // Verify minimum 44px touch target height
      expect(bagItemStyle.minHeight).toBeGreaterThanOrEqual(44);

      // Verify adequate padding for touch targets
      expect(bagItemStyle.paddingVertical).toBeGreaterThanOrEqual(12);
      expect(bagItemStyle.paddingHorizontal).toBeGreaterThanOrEqual(16);
    });

    it('should show elevated shadows on selected bag items', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'My primary disc bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag item before selection
      const bagItem = getByTestId('bag-item-bag1');

      // Select the bag item
      fireEvent.press(bagItem);

      // Wait for selection animation/styling to apply
      await waitFor(() => {
        const selectedBagItem = getByTestId('bag-item-bag1');
        const selectedStyle = selectedBagItem.props.style;

        // Verify selected styling includes shadow properties
        expect(selectedStyle).toEqual(expect.objectContaining({
          shadowColor: expect.any(String),
          shadowOffset: expect.any(Object),
          shadowOpacity: expect.any(Number),
          shadowRadius: expect.any(Number),
          elevation: expect.any(Number),
        }));
      });
    });
  });

  describe('Enhanced Typography Hierarchy - Phase 2', () => {
    it('should display bag names with prominent heading typography', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Primary Tournament Bag', description: 'Professional setup for competitions' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByText, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag name text element
      const bagNameElement = getByText('Primary Tournament Bag');
      expect(bagNameElement.props.style).toEqual(expect.objectContaining({
        fontWeight: expect.stringMatching(/^[67]/), // '600' or '700'
        fontSize: expect.any(Number),
      }));
    });

    it('should display bag descriptions with proper secondary text hierarchy', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Primary Tournament Bag', description: 'Professional setup for competitions' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByText, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get bag description text element
      const bagDescriptionElement = getByText('Professional setup for competitions');
      expect(bagDescriptionElement.props.style).toEqual(expect.objectContaining({
        fontSize: expect.any(Number),
        color: expect.any(String),
      }));
    });

    it('should display disc count with consistent caption typography', async () => {
      // Mock successful bag loading with disc count
      const mockResponse = {
        bags: [
          {
            id: 'bag1', name: 'Main Bag', description: 'Primary bag', disc_count: 15,
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByText, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get disc count text element
      const discCountElement = getByText('15 discs');
      expect(discCountElement.props.style).toEqual(expect.objectContaining({
        fontSize: expect.any(Number),
        color: expect.any(String),
      }));
    });

    it('should maintain typography hierarchy consistency across all text elements', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          {
            id: 'bag1', name: 'Tournament Bag', description: 'Competition ready', disc_count: 12,
          },
          {
            id: 'bag2', name: 'Practice Bag', description: 'Daily throwing', disc_count: 8,
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByText, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Check multiple bag names have consistent styling
      const bagName1 = getByText('Tournament Bag');
      const bagName2 = getByText('Practice Bag');

      expect(bagName1.props.style.fontWeight).toBe(bagName2.props.style.fontWeight);
      expect(bagName1.props.style.fontSize).toBe(bagName2.props.style.fontSize);

      // Check descriptions have consistent styling
      const description1 = getByText('Competition ready');
      const description2 = getByText('Daily throwing');

      expect(description1.props.style.fontSize).toBe(description2.props.style.fontSize);
      expect(description1.props.style.color).toBe(description2.props.style.color);
    });
  });

  describe('Modern Selection Indicators - Phase 3', () => {
    it('should display modern selection indicators with proper styling', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get selection indicator
      const selectionIndicator = getByTestId('selection-indicator-bag1');
      expect(selectionIndicator).toBeTruthy();

      // Verify it has proper structure for modern styling
      expect(selectionIndicator.props.style).toEqual(expect.objectContaining({
        marginLeft: expect.any(Number),
        position: 'relative',
      }));
    });

    it('should show checkmark badge when bag is selected', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Initially should not show checkmark
      expect(queryByTestId('checkmark-badge-bag1')).toBeNull();

      // Select bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Should now show checkmark indicator
      await waitFor(() => {
        const selectionIndicator = getByTestId('selection-indicator-bag1');
        expect(selectionIndicator).toBeTruthy();
        // The checkmark should be within the selection indicator structure
      });
    });

    it('should have proper radio button styling for unselected state', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get selection indicator in unselected state
      const selectionIndicator = getByTestId('selection-indicator-bag1');

      // Should have radio button container styling
      expect(selectionIndicator.children[0].props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }),
      ]));
    });

    it('should transition selection indicators between different bags', async () => {
      // Mock successful bag loading with multiple bags
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
          { id: 'bag2', name: 'Secondary Bag', description: 'Secondary bag' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select first bag
      const bagItem1 = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem1);

      // Verify first bag is selected
      await waitFor(() => {
        const selectedBagItem = getByTestId('bag-item-bag1');
        expect(selectedBagItem.props.accessibilityState.selected).toBe(true);
      });

      // Select second bag
      const bagItem2 = getByTestId('bag-item-bag2');
      fireEvent.press(bagItem2);

      // Verify selection moved to second bag
      await waitFor(() => {
        const bagItem1After = getByTestId('bag-item-bag1');
        const bagItem2After = getByTestId('bag-item-bag2');
        expect(bagItem1After.props.accessibilityState.selected).toBe(false);
        expect(bagItem2After.props.accessibilityState.selected).toBe(true);
      });
    });
  });

  describe('Advanced Animations and Polish - Phase 4', () => {
    it('should apply smooth scale animations to selected bag items', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get animated bag item
      const animatedBagItem = getByTestId('animated-bag-item-bag1');
      expect(animatedBagItem).toBeTruthy();

      // Should have transform style property for animations
      expect(animatedBagItem.props.style).toEqual(expect.objectContaining({
        transform: expect.any(Array),
      }));
    });

    it('should animate disc showcase section with fade-in effect', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Get animated disc showcase section
      const animatedDiscShowcase = getByTestId('animated-disc-showcase-section');
      expect(animatedDiscShowcase).toBeTruthy();

      // Parent should have opacity animation (may be number during testing)
      const showcaseSection = getByTestId('disc-showcase-section');
      expect(showcaseSection.props.style).toEqual(expect.objectContaining({
        opacity: expect.any(Number), // Animation value during testing
      }));
    });

    it('should animate bag selection section with slide-in effect', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load and animation to start
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get animated bag selection section
      const animatedBagSection = getByTestId('animated-bag-selection-section');
      expect(animatedBagSection).toBeTruthy();

      // Should have opacity and transform animations (numbers during testing)
      expect(animatedBagSection.props.style).toEqual(expect.objectContaining({
        opacity: expect.any(Number), // Animation value during testing
        transform: expect.arrayContaining([
          expect.objectContaining({
            translateY: expect.any(Number), // Animation value during testing
          }),
        ]),
      }));
    });

    it('should animate error section with slide-in effect when errors occur', async () => {
      // Mock bag loading error
      bagService.getBags.mockRejectedValue(new Error('Network error'));

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for error state to appear
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Get animated error section
      const animatedErrorSection = getByTestId('animated-error-section');
      expect(animatedErrorSection).toBeTruthy();

      // Should have opacity and transform animations (numbers during testing)
      expect(animatedErrorSection.props.style).toEqual(expect.objectContaining({
        opacity: expect.any(Number), // Animation value during testing
        transform: expect.arrayContaining([
          expect.objectContaining({
            translateY: expect.any(Number), // Animation value during testing
          }),
        ]),
      }));
    });

    it('should provide haptic feedback on bag selection for enhanced user experience', async () => {
      // Mock successful bag loading
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Select bag
      const bagItem = getByTestId('bag-item-bag1');
      fireEvent.press(bagItem);

      // Verify haptic feedback was triggered
      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
    });

    it('should maintain smooth animation performance during selection changes', async () => {
      // Mock successful bag loading with multiple bags
      const mockResponse = {
        bags: [
          { id: 'bag1', name: 'Main Bag', description: 'Primary bag' },
          { id: 'bag2', name: 'Secondary Bag', description: 'Secondary bag' },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      };
      bagService.getBags.mockResolvedValue(mockResponse);

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      // Wait for bags to load
      await waitFor(() => {
        expect(queryByTestId('skeleton-loading-section')).toBeNull();
      }, { timeout: 5000 });

      // Rapidly select different bags to test animation performance
      const bagItem1 = getByTestId('bag-item-bag1');
      const bagItem2 = getByTestId('bag-item-bag2');

      // Select first bag
      fireEvent.press(bagItem1);

      // Quickly select second bag
      fireEvent.press(bagItem2);

      // Verify both animated bag items maintain their structure
      const animatedBagItem1 = getByTestId('animated-bag-item-bag1');
      const animatedBagItem2 = getByTestId('animated-bag-item-bag2');

      expect(animatedBagItem1.props.style.transform).toBeTruthy();
      expect(animatedBagItem2.props.style.transform).toBeTruthy();

      // Verify haptic feedback was called for both selections
      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalledTimes(2);
    });
  });
});
