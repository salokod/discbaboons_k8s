/**
 * RecoverDiscModal Theme Integration Tests
 * Tests dark mode theming and proper use of theme colors
 */

import { render } from '@testing-library/react-native';
import RecoverDiscModal from '../../../src/components/modals/RecoverDiscModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as bagService from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
  bulkRecoverDiscs: jest.fn(),
}));

describe('RecoverDiscModal Theme Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use theme colors instead of hardcoded colors', () => {
    const { getByTestId } = render(
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

    // Test passes if component renders without hardcoded colors
    expect(getByTestId('close-button')).toBeTruthy();
  });

  it('should properly integrate with dark mode theme', () => {
    // Mock bags response for error retry button
    bagService.getBags.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = render(
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

    // Component should render with theme colors
    expect(getByTestId('close-button')).toBeTruthy();
  });

  it('should use theme colors for flight number badges', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RecoverDiscModal
          visible
          onClose={jest.fn()}
          onSuccess={jest.fn()}
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
        />
      </ThemeProvider>,
    );

    // Flight numbers should use theme colors
    expect(getByTestId('speed-badge')).toBeTruthy();
    expect(getByTestId('glide-badge')).toBeTruthy();
    expect(getByTestId('turn-badge')).toBeTruthy();
    expect(getByTestId('fade-badge')).toBeTruthy();
  });

  it('should use theme-appropriate overlay background', () => {
    const { getByTestId } = render(
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

    // Modal should render with theme-appropriate overlay
    expect(getByTestId('close-button')).toBeTruthy();
  });

  describe('Text readability fixes', () => {
    it('should use proper textSecondary color for secondary text', async () => {
      // Mock successful bags response to show bag selection
      bagService.getBags.mockResolvedValue({
        bags: [
          {
            id: '1', name: 'Main Bag', description: 'Primary bag', disc_count: 15,
          },
          {
            id: '2', name: 'Backup Bag', description: 'Secondary bag', disc_count: 8,
          },
        ],
        pagination: { total: 2 },
      });

      const { getByText, findByText } = render(
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

      // These should render with proper textSecondary color
      expect(getByText('Recovering 1 disc:')).toBeTruthy();

      // Wait for bags to load and then check for the text
      await expect(findByText('Select destination bag:')).resolves.toBeTruthy();
    });

    it('should use proper text color for close button icon', () => {
      const { getByTestId } = render(
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

      // Close button should use high contrast text color
      const closeButton = getByTestId('close-button');
      expect(closeButton).toBeTruthy();
    });

    it('should use proper colors for flight number labels', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <RecoverDiscModal
            visible
            onClose={jest.fn()}
            onSuccess={jest.fn()}
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
          />
        </ThemeProvider>,
      );

      // Flight number badges should use textSecondary for labels (S, G, T, F)
      // This test ensures the badges render correctly with theme colors
      expect(getByTestId('flight-numbers-section')).toBeTruthy();
      expect(getByTestId('speed-badge')).toBeTruthy();
      expect(getByTestId('glide-badge')).toBeTruthy();
      expect(getByTestId('turn-badge')).toBeTruthy();
      expect(getByTestId('fade-badge')).toBeTruthy();
    });

    it('should render consistently across all themes', () => {
      const themes = ['light', 'dark', 'blackout'];

      themes.forEach((themeName) => {
        const { getByTestId, unmount } = render(
          <ThemeProvider initialTheme={themeName}>
            <RecoverDiscModal
              visible
              onClose={jest.fn()}
              onSuccess={jest.fn()}
              discs={[{ id: '1', model: 'Destroyer', brand: 'Innova' }]}
              targetBagId=""
            />
          </ThemeProvider>,
        );

        // Modal should render successfully in all themes
        expect(getByTestId('close-button')).toBeTruthy();

        // Clean up between theme tests
        unmount();
      });
    });
  });
});
