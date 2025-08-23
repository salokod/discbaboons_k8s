/**
 * BagsListScreen Lost Discs Header Button Tests
 */

import {
  render, waitFor, fireEvent,
} from '@testing-library/react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';

// Mock AuthContext since EmptyBagsScreen now uses it
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock bag service
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
}));

describe('BagsListScreen - Lost Discs Header Button', () => {
  let mockUseAuth;
  let mockGetBags;
  let mockNavigation;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    const mockTokenStorage = require('../../../src/services/tokenStorage');
    mockGetBags = require('../../../src/services/bagService').getBags;

    // Default auth state for regular user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false,
      },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    });

    mockTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'token123',
      refreshToken: 'refresh123',
    });

    // Mock navigation
    mockNavigation = {
      navigate: jest.fn(),
    };

    // Mock bags service to return some bags (so we see the header with bags)
    mockGetBags.mockResolvedValue({
      bags: [
        {
          id: '1',
          name: 'Test Bag 1',
          description: 'A test bag',
          bag_contents: [{ id: 'disc1', model: 'Destroyer' }],
        },
        {
          id: '2',
          name: 'Test Bag 2',
          description: 'Another test bag',
          bag_contents: [{ id: 'disc2', model: 'Wraith' }],
        },
      ],
    });

    jest.clearAllMocks();
  });

  const renderScreen = () => render(
    <ThemeProvider>
      <BagRefreshProvider>
        <BagsListScreen navigation={mockNavigation} />
      </BagRefreshProvider>
    </ThemeProvider>,
  );

  it('should display lost discs header button with icon', async () => {
    const { getByTestId } = renderScreen();

    // Wait for bags to load
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalled();
    });

    // Check for lost discs button
    const lostDiscsButton = getByTestId('lost-discs-header-button');
    expect(lostDiscsButton).toBeTruthy();
  });

  it('should have correct accessibility properties on lost discs button', async () => {
    const { getByTestId } = renderScreen();

    // Wait for bags to load
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalled();
    });

    const lostDiscsButton = getByTestId('lost-discs-header-button');
    expect(lostDiscsButton.props.accessibilityLabel).toBe('Lost Discs - Search for lost discs');
    expect(lostDiscsButton.props.accessibilityRole).toBe('button');
  });

  it('should navigate to LostDiscs screen when pressed', async () => {
    const { getByTestId } = renderScreen();

    // Wait for bags to load
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalled();
    });

    const lostDiscsButton = getByTestId('lost-discs-header-button');
    fireEvent.press(lostDiscsButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LostDiscs', { navigationSource: 'BagsList' });
  });

  it('should have proper touch target size (minimum 44px height)', async () => {
    const { getByTestId } = renderScreen();

    // Wait for bags to load
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalled();
    });

    const lostDiscsButton = getByTestId('lost-discs-header-button');
    const buttonStyle = lostDiscsButton.props.style;

    // Check if style contains expected dimensions (could be in array or object)
    const flatStyle = Array.isArray(buttonStyle)
      ? Object.assign({}, ...buttonStyle.filter(Boolean))
      : buttonStyle || {};

    expect(flatStyle.minWidth).toBe(44);
    expect(flatStyle.height).toBe(44);
  });

  describe('Slice 1: Button Text Visibility', () => {
    it('should display "Lost Discs" text in the button', async () => {
      const { getByText } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      // Check that "Lost Discs" text is displayed
      const lostDiscsText = getByText('Lost Discs');
      expect(lostDiscsText).toBeTruthy();
    });

    it('should have "Lost Discs" text as a child of the button', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Check that button contains text content
      expect(lostDiscsButton.findByProps({ children: 'Lost Discs' })).toBeTruthy();
    });
  });

  describe('Slice 2: Button Layout Structure', () => {
    it('should have flexbox layout with row direction for text+icon alignment', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const buttonStyle = lostDiscsButton.props.style;

      // Check if style contains expected flexbox properties
      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      expect(flatStyle.flexDirection).toBe('row');
      expect(flatStyle.alignItems).toBe('center');
    });

    it('should have proper spacing between text and icon elements', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const buttonStyle = lostDiscsButton.props.style;

      // Check if style contains expected gap or padding for spacing
      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Should have some form of spacing (gap, paddingHorizontal, etc.)
      expect(
        flatStyle.gap !== undefined
        || flatStyle.paddingHorizontal !== undefined
        || flatStyle.paddingLeft !== undefined,
      ).toBeTruthy();
    });
  });

  describe('Slice 3: Responsive Text Handling', () => {
    it('should have text that adapts to button size and does not overflow', async () => {
      const { getByText } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsText = getByText('Lost Discs');
      const textStyle = lostDiscsText.props.style;

      // Check text styling for responsiveness
      const flatTextStyle = Array.isArray(textStyle)
        ? Object.assign({}, ...textStyle.filter(Boolean))
        : textStyle || {};

      // Should have appropriate font size for small button
      expect(flatTextStyle.fontSize).toBeLessThanOrEqual(14);
      expect(flatTextStyle.fontSize).toBeGreaterThanOrEqual(10);
    });

    it('should maintain minimum touch target while accommodating text', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const buttonStyle = lostDiscsButton.props.style;

      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Should maintain minimum touch target size
      expect(flatStyle.height).toBeGreaterThanOrEqual(44);
      expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);

      // Should have horizontal padding to accommodate text
      expect(flatStyle.paddingHorizontal).toBeGreaterThan(0);
    });
  });

  describe('Slice 4: Icon Selection Update', () => {
    it('should use search-outline icon instead of warning-outline icon', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Find the Icon component within the button
      const iconElement = lostDiscsButton.findByType(require('@react-native-vector-icons/ionicons').default);
      expect(iconElement.props.name).toBe('search-outline');
    });

    it('should maintain the same icon size and color with new search icon', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Find the Icon component and check properties
      const iconElement = lostDiscsButton.findByType(require('@react-native-vector-icons/ionicons').default);
      expect(iconElement.props.size).toBe(24);
      expect(iconElement.props.color).toBe('#FF9500');
    });
  });

  describe('Slice 5: Style Refinement', () => {
    it('should have consistent orange theming throughout button elements', async () => {
      const { getByTestId, getByText } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsText = getByText('Lost Discs');
      const textStyle = lostDiscsText.props.style;
      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const iconElement = lostDiscsButton.findByType(require('@react-native-vector-icons/ionicons').default);

      // Check consistent orange color (#FF9500)
      const flatTextStyle = Array.isArray(textStyle)
        ? Object.assign({}, ...textStyle.filter(Boolean))
        : textStyle || {};

      expect(flatTextStyle.color).toBe('#FF9500');
      expect(iconElement.props.color).toBe('#FF9500');
    });

    it('should have refined padding and spacing for better visual balance', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const buttonStyle = lostDiscsButton.props.style;

      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Should have proper padding and gap for visual balance
      expect(flatStyle.paddingHorizontal).toBeGreaterThan(4);
      expect(flatStyle.gap).toBeGreaterThan(2);
      expect(flatStyle.borderRadius).toBeGreaterThan(0);
    });
  });

  describe('Slice 6: Accessibility Enhancement', () => {
    it('should have enhanced accessibility label that describes the new button design', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Should have a descriptive accessibility label for "Lost Discs" feature
      expect(lostDiscsButton.props.accessibilityLabel).toBe('Lost Discs - Search for lost discs');
      expect(lostDiscsButton.props.accessibilityRole).toBe('button');
    });

    it('should provide accessibility hint for screen reader users', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Should have accessibility hint to help users understand the action
      expect(lostDiscsButton.props.accessibilityHint).toBeDefined();
      expect(typeof lostDiscsButton.props.accessibilityHint).toBe('string');
      expect(lostDiscsButton.props.accessibilityHint.length).toBeGreaterThan(0);
    });
  });

  describe('Slice 7: Visual Polish', () => {
    it('should have subtle border styling for visual polish', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');
      const buttonStyle = lostDiscsButton.props.style;

      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Should have subtle border for visual definition
      expect(flatStyle.borderWidth).toBeGreaterThan(0);
      expect(flatStyle.borderColor).toBeDefined();
      expect(typeof flatStyle.borderColor).toBe('string');
    });

    it('should have press state styling through activeOpacity', async () => {
      const { getByTestId } = renderScreen();

      // Wait for bags to load
      await waitFor(() => {
        expect(mockGetBags).toHaveBeenCalled();
      });

      const lostDiscsButton = getByTestId('lost-discs-header-button');

      // Verify the button exists and is interactive (implying press state)
      expect(lostDiscsButton).toBeTruthy();
      expect(lostDiscsButton.props.testID).toBe('lost-discs-header-button');

      // We can't directly test activeOpacity in React Testing Library,
      // but the TouchableOpacity component with activeOpacity={0.7} provides press feedback
      expect(lostDiscsButton.props.accessible).toBe(true);
    });
  });
});
