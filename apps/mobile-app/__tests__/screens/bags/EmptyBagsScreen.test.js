/**
 * EmptyBagsScreen Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmptyBagsScreen from '../../../src/screens/bags/EmptyBagsScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert = {
    alert: jest.fn(),
  };
  return RN;
});

describe('EmptyBagsScreen', () => {
  let mockUseAuth;
  let mockTokenStorage;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    mockTokenStorage = require('../../../src/services/tokenStorage');

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a EmptyBagsScreen component', () => {
    expect(EmptyBagsScreen).toBeTruthy();
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <EmptyBagsScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('empty-bags-screen')).toBeTruthy();
  });

  it('should display empty state with title and subtitle', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen />
      </ThemeProvider>,
    );

    expect(getByText('Organize Your Disc Golf Collection')).toBeTruthy();
    expect(getByText('Keep track of all your discs, bags, and home collection. Create bags like \'Home Collection\', \'Tournament Bag\', or \'Glow Round\' to organize your discs however you like.')).toBeTruthy();
  });

  it('should display create first bag button', () => {
    const mockOnCreate = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen onCreateFirstBag={mockOnCreate} />
      </ThemeProvider>,
    );

    expect(getByText('Create First Bag')).toBeTruthy();
  });

  it('should call onCreateFirstBag when button is pressed', () => {
    const onCreateFirstBagMock = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyBagsScreen onCreateFirstBag={onCreateFirstBagMock} />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Create First Bag'));
    expect(onCreateFirstBagMock).toHaveBeenCalledTimes(1);
  });

  describe('Admin Button Visibility', () => {
    it('should NOT show admin button for regular users', () => {
      // Regular user (default mock setup)
      const { queryByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen />
        </ThemeProvider>,
      );

      expect(queryByText('Admin: Approve Discs')).toBeNull();
    });

    it('should show admin button for admin users', () => {
      // Mock admin user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 1, username: 'adminuser', email: 'admin@example.com', isAdmin: true,
        },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      });

      const { getByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen />
        </ThemeProvider>,
      );

      expect(getByText('Admin: Approve Discs')).toBeTruthy();
    });

    it('should navigate to AdminDiscScreen when admin button is pressed', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      // Mock admin user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 1, username: 'adminuser', email: 'admin@example.com', isAdmin: true,
        },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      });

      const { getByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen navigation={mockNavigation} />
        </ThemeProvider>,
      );

      fireEvent.press(getByText('Admin: Approve Discs'));

      // Wait for async checkAuthAndNavigate to complete
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('AdminDiscScreen');
      });
    });

    it('should handle missing user gracefully', () => {
      // Mock no user
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        tokens: null,
      });

      const { queryByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen />
        </ThemeProvider>,
      );

      expect(queryByText('Admin: Approve Discs')).toBeNull();
    });
  });
});
