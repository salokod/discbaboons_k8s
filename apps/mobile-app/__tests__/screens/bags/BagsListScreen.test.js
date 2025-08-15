/**
 * BagsListScreen Tests
 */

import { render, waitFor } from '@testing-library/react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

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

describe('BagsListScreen', () => {
  let mockUseAuth;
  let mockGetBags;

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

    // Mock getBags to return empty array by default
    mockGetBags.mockResolvedValue({ bags: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a BagsListScreen component', () => {
    expect(BagsListScreen).toBeTruthy();
  });

  it('should show empty bags screen when no bags exist', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagsListScreen />
      </ThemeProvider>,
    );

    // Wait for loading to complete and EmptyBagsScreen to render
    await waitFor(() => {
      expect(getByTestId('empty-bags-screen')).toBeTruthy();
    });
  });

  it('should display empty state content', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagsListScreen />
      </ThemeProvider>,
    );

    // Wait for loading to complete and EmptyBagsScreen content to render
    await waitFor(() => {
      expect(getByText('Organize Your Disc Golf Collection')).toBeTruthy();
      expect(getByText('Create First Bag')).toBeTruthy();
    });
  });

  it('should render hamburger menu button', async () => {
    // Mock getBags to return some bags so we see the main screen
    mockGetBags.mockResolvedValue({
      bags: [{ id: 1, name: 'Test Bag', discCount: 5 }],
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <BagsListScreen />
      </ThemeProvider>,
    );

    // Wait for loading to complete and hamburger menu button to render
    await waitFor(() => {
      expect(getByTestId('hamburger-menu-button')).toBeTruthy();
    });
  });
});
