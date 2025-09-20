/**
 * FriendCard Component Tests
 * Test suite for individual friend display and basic interactions
 */

import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import FriendCard from '../FriendCard';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock dependencies
jest.mock('../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
    border: '#E1E1E1',
    white: '#FFFFFF',
  }),
}));

const mockFriend = {
  id: 789,
  username: 'johndoe',
  friendship: {
    id: 123,
    status: 'accepted',
    created_at: '2024-01-15T10:30:00.000Z',
  },
  bag_stats: {
    total_bags: 5,
    visible_bags: 3,
    public_bags: 1,
  },
};

describe('FriendCard', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display friend username, profile image, friendship date', () => {
    const { getByText, getByTestId } = renderWithNavigation(
      <FriendCard friend={mockFriend} navigation={mockNavigation} />,
    );

    expect(getByTestId('friend-card')).toBeTruthy();
    expect(getByText('johndoe')).toBeTruthy();
    expect(getByTestId('friend-profile-image')).toBeTruthy();
    expect(getByText(/Jan 15, 2024/)).toBeTruthy();
  });

  it('should show bag stats: "5 bags (3 visible)"', () => {
    const { getByText } = renderWithNavigation(
      <FriendCard friend={mockFriend} navigation={mockNavigation} />,
    );

    expect(getByText('5 bags (3 visible)')).toBeTruthy();
  });

  it('should navigate to friend profile on card tap', () => {
    const { getByTestId } = renderWithNavigation(
      <FriendCard friend={mockFriend} navigation={mockNavigation} />,
    );

    const card = getByTestId('friend-card');
    fireEvent.press(card);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FriendProfile', {
      friendId: 789,
      friend: mockFriend,
    });
  });

  it('should have proper accessibility labels and roles', () => {
    const { getByTestId } = renderWithNavigation(
      <FriendCard friend={mockFriend} navigation={mockNavigation} />,
    );

    const card = getByTestId('friend-card');
    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityLabel).toContain('johndoe');
    expect(card.props.accessibilityHint).toContain('Tap to view profile');
  });
});
