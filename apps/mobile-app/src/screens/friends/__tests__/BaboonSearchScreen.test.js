/**
 * BaboonSearchScreen Component Tests
 * Tests for the baboon search and discovery screen
 */

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '../../../context/ThemeContext';
import { FriendsProvider } from '../../../context/FriendsContext';
import BaboonSearchScreen from '../BaboonSearchScreen';
import { friendService } from '../../../services/friendService';

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock the friend service
jest.mock('../../../services/friendService', () => ({
  friendService: {
    searchUsers: jest.fn(),
    sendRequest: jest.fn(),
    getRequests: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Test wrapper component
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

describe('BaboonSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export BaboonSearchScreen component', () => {
    expect(BaboonSearchScreen).toBeDefined();
  });

  it('should display search input with baboon-themed placeholder', () => {
    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    expect(screen.getByPlaceholderText('Search for baboons to join your troop...')).toBeOnTheScreen();
  });

  it('should display empty state when no search performed', () => {
    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    expect(screen.getByText('Find Baboons for Your Troop')).toBeOnTheScreen();
    expect(screen.getByText('Search by username or email to discover other baboons and send troop invites!')).toBeOnTheScreen();
  });

  it('should display search button', () => {
    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    expect(screen.getByTestId('search-button')).toBeOnTheScreen();
  });

  it('should trigger search when search button is pressed', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
        { id: 2, username: 'testbaboon2', email: 'test2@example.com' },
      ],
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(friendService.searchUsers).toHaveBeenCalledWith('testbaboon');
    });
  });

  it('should trigger search when Enter key is pressed', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
        { id: 2, username: 'testbaboon2', email: 'test2@example.com' },
      ],
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent(searchInput, 'submitEditing');

    await waitFor(() => {
      expect(friendService.searchUsers).toHaveBeenCalledWith('testbaboon');
    });
  });

  it('should not trigger search automatically when typing in input', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');

    fireEvent.changeText(searchInput, 'testbaboon');

    // Wait a bit to ensure no search is triggered
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(friendService.searchUsers).not.toHaveBeenCalled();
  });

  it('should display search results when search returns users', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
        { id: 2, username: 'testbaboon2', email: 'test2@example.com' },
      ],
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('testbaboon1')).toBeOnTheScreen();
      expect(screen.getByText('testbaboon2')).toBeOnTheScreen();
    });
  });

  it('should display Send Invite buttons for each search result', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });
  });

  it('should call sendRequest when Send Invite button is pressed', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockResolvedValue({
      request: { id: 123, recipient_id: 1, status: 'pending' },
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(friendService.sendRequest).toHaveBeenCalledWith(1);
    });
  });

  it('should show success toast when invite is sent successfully', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockResolvedValue({
      request: { id: 123, recipient_id: 1, status: 'pending' },
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(screen.getByText('Invite sent successfully!')).toBeOnTheScreen();
    });
  });

  it('should show error toast when invite sending fails', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send invite. Please try again.')).toBeOnTheScreen();
    });
  });

  it('should show user-friendly error message for duplicate friend request', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockRejectedValue(new Error('Friend request already exists'));

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(screen.getByText("You've already sent an invite to this baboon")).toBeOnTheScreen();
    });
  });

  it('should show user-friendly error message for authentication failure', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockRejectedValue(new Error('Authentication failed'));

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(screen.getByText('Please log in again to send invites')).toBeOnTheScreen();
    });
  });

  it('should refresh friend requests after sending invite successfully', async () => {
    friendService.searchUsers.mockResolvedValue({
      users: [
        { id: 1, username: 'testbaboon1', email: 'test1@example.com' },
      ],
    });
    friendService.sendRequest.mockResolvedValue({
      request: { id: 123, recipient_id: 1, status: 'pending' },
    });

    // Mock both incoming and outgoing getRequests calls for the refresh
    friendService.getRequests.mockImplementation((type) => {
      if (type === 'incoming') {
        return Promise.resolve({ requests: [] });
      }
      if (type === 'outgoing') {
        return Promise.resolve({
          requests: [{ id: 123, recipient_id: 1, status: 'pending' }],
        });
      }
      return Promise.resolve({ requests: [] });
    });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeOnTheScreen();
    });

    const sendInviteButton = screen.getByText('Send Invite');
    fireEvent.press(sendInviteButton);

    await waitFor(() => {
      expect(screen.getByText('Invite sent successfully!')).toBeOnTheScreen();
    });

    // Should call getRequests to refresh after successful invite
    expect(friendService.getRequests).toHaveBeenCalledWith('incoming');
    expect(friendService.getRequests).toHaveBeenCalledWith('outgoing');
  });

  it('should display loading state while searching', async () => {
    friendService.searchUsers.mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve({ users: [] }), 100);
      }),
    );

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    expect(screen.getByText('Searching for baboons...')).toBeOnTheScreen();
  });

  it('should display no results message when search returns empty array', async () => {
    friendService.searchUsers.mockResolvedValue({ users: [] });

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'nonexistent');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No baboons found')).toBeOnTheScreen();
      expect(screen.getByText('Your friend might have their profile set to private. Ask them to check their Profile Settings and enable \'Show name in search results\' to join your troop!')).toBeOnTheScreen();
    });
  });

  it('should display error message when search fails', async () => {
    friendService.searchUsers.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<BaboonSearchScreen navigation={mockNavigation} />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.changeText(searchInput, 'testbaboon');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Error searching for baboons. Please try again.')).toBeOnTheScreen();
    });
  });
});
