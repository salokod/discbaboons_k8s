/**
 * BaboonsTabView Component Tests
 * Tests for tab navigation in Baboons screen
 */

import {
  render, screen, fireEvent,
} from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import { FriendsProvider } from '../../context/FriendsContext';
import BaboonsTabView from '../BaboonsTabView';

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

const mockNavigation = {
  navigate: jest.fn(),
};

// Test wrapper component to set up requests state
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      <FriendsProvider>
        {children}
      </FriendsProvider>
    </ThemeProvider>
  );
}

const renderWithProviders = (component) => render(<TestWrapper>{component}</TestWrapper>);

describe('BaboonsTabView', () => {
  it('should export BaboonsTabView component', () => {
    expect(BaboonsTabView).toBeDefined();
  });

  it('should display Friends and Requests tabs', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    expect(screen.getByText('Friends')).toBeOnTheScreen();
    expect(screen.getByText('Requests')).toBeOnTheScreen();
  });

  it('should show Friends tab as active by default', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    expect(screen.getByTestId('friends-tab')).toBeOnTheScreen();
  });

  it('should switch to requests tab when pressed', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    fireEvent.press(screen.getByTestId('requests-tab-button'));

    expect(screen.getByTestId('requests-tab')).toBeOnTheScreen();
  });
});
