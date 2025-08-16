/**
 * EmptyBagsScreen Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
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

  describe('Disc Database Buttons', () => {
    it('should display "Search Discs" button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen />
        </ThemeProvider>,
      );

      expect(getByText('Search Discs')).toBeTruthy();
    });

    it('should NOT display "Submit New Disc" button (moved to settings drawer)', () => {
      const { queryByText } = render(
        <ThemeProvider>
          <EmptyBagsScreen />
        </ThemeProvider>,
      );

      expect(queryByText('Submit New Disc')).toBeNull();
    });
  });

  describe('Admin Section Removal', () => {
    it('should NOT display admin section even for admin users (moved to settings drawer)', () => {
      // Mock admin user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 1, username: 'adminuser', email: 'admin@example.com', isAdmin: true,
        },
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
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
