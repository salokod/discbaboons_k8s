/**
 * @jest-environment node
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlayerSelectionModal from '../PlayerSelectionModal';
import { ThemeProvider } from '../../../context/ThemeContext';
import { friendService } from '../../../services/friendService';

// Mock the friendService
jest.mock('../../../services/friendService', () => ({
  friendService: {
    getFriends: jest.fn(),
    searchUsers: jest.fn(),
  },
}));

// Mock the roundService
jest.mock('../../../services/roundService', () => ({
  roundService: {
    addPlayersToRound: jest.fn(),
  },
}));

// Helper to render component with theme
const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('PlayerSelectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sub-Slice 7.1: Modal Shell', () => {
    it('should render when visible prop is true', () => {
      const { getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      expect(getByText('Add Players')).toBeTruthy();
    });

    it('should not render when visible prop is false', () => {
      const { queryByText } = renderWithTheme(
        <PlayerSelectionModal
          visible={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      expect(queryByText('Add Players')).toBeNull();
    });

    it('should call onClose when close button pressed', () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const closeButton = getByTestId('modal-close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display "Add Players" as header title', () => {
      const { getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const title = getByText('Add Players');
      expect(title).toBeTruthy();
    });
  });

  describe('Sub-Slice 7.2: Tab Navigation', () => {
    it('should render Friends and Search tabs', () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      expect(getByTestId('tab-friends')).toBeTruthy();
      expect(getByTestId('tab-search')).toBeTruthy();
    });

    it('should default to Friends tab', () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const friendsTab = getByTestId('tab-friends');
      expect(friendsTab.props.accessibilityState.selected).toBe(true);
    });

    it('should switch to Search tab when Search tab pressed', () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      expect(searchTab.props.accessibilityState.selected).toBe(true);
    });

    it('should highlight active tab with primary color', () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const friendsTab = getByTestId('tab-friends');
      const searchTab = getByTestId('tab-search');

      // Friends tab should be active by default (has primary color border)
      expect(friendsTab.props.style.borderBottomColor).toBeTruthy();

      // Press search tab
      fireEvent.press(searchTab);

      // Now search tab should be active
      expect(searchTab.props.style.borderBottomColor).toBeTruthy();
    });
  });

  describe('Sub-Slice 7.3: Friends List Loading', () => {
    it('should load friends on mount when visible', async () => {
      const mockFriends = [
        { id: 1, username: 'friend1', full_name: 'Friend One' },
        { id: 2, username: 'friend2', full_name: 'Friend Two' },
      ];

      friendService.getFriends.mockResolvedValueOnce({
        friends: mockFriends,
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(friendService.getFriends).toHaveBeenCalledTimes(1);
      });
    });

    it('should display loading skeleton while loading friends', () => {
      friendService.getFriends.mockImplementationOnce(
        () => new Promise(() => {}), // Never resolves
      );

      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      expect(getByTestId('friends-loading')).toBeTruthy();
    });

    it('should display friends list after successful load', async () => {
      const mockFriends = [
        { id: 1, username: 'friend1', full_name: 'Friend One' },
        { id: 2, username: 'friend2', full_name: 'Friend Two' },
      ];

      friendService.getFriends.mockResolvedValueOnce({
        friends: mockFriends,
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
        expect(getByText('Friend Two')).toBeTruthy();
      });
    });

    it('should display error message if getFriends fails', async () => {
      friendService.getFriends.mockRejectedValueOnce(
        new Error('Network error'),
      );

      const { getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Error loading friends')).toBeTruthy();
      });
    });

    it('should show empty state when user has no friends', async () => {
      friendService.getFriends.mockResolvedValueOnce({
        friends: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getAllByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        const elements = getAllByText('No friends yet');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sub-Slice 7.4: Multi-Select Functionality', () => {
    const mockFriends = [
      { id: 1, username: 'friend1', full_name: 'Friend One' },
      { id: 2, username: 'friend2', full_name: 'Friend Two' },
      { id: 3, username: 'friend3', full_name: 'Friend Three' },
    ];

    beforeEach(() => {
      friendService.getFriends.mockResolvedValue({
        friends: mockFriends,
        pagination: {
          total: 3, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    it('should display checkbox for each friend', async () => {
      const { getAllByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        const checkboxes = getAllByTestId(/checkbox-/);
        expect(checkboxes.length).toBe(3);
      });
    });

    it('should select friend when row pressed', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      const checkbox = getByTestId('checkbox-1');
      expect(checkbox.props.name).toBe('checkbox');
    });

    it('should deselect friend when pressed again', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      const friendRow = getByTestId('friend-row-1');

      // Select
      fireEvent.press(friendRow);
      let checkbox = getByTestId('checkbox-1');
      expect(checkbox.props.name).toBe('checkbox');

      // Deselect
      fireEvent.press(friendRow);
      checkbox = getByTestId('checkbox-1');
      expect(checkbox.props.name).toBe('square-outline');
    });

    it('should display checked checkbox when friend selected', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      const checkbox = getByTestId('checkbox-1');
      expect(checkbox.props.name).toBe('checkbox');
    });

    it('should apply selected background tint to selected friends', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      const friendRow = getByTestId('friend-row-1');
      const originalStyle = friendRow.props.style;

      fireEvent.press(friendRow);

      const updatedStyle = getByTestId('friend-row-1').props.style;
      expect(updatedStyle).not.toEqual(originalStyle);
    });

    it('should exclude already added players from selection', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[{ userId: 1 }]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      const friendRow = getByTestId('friend-row-1');
      expect(friendRow.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Sub-Slice 7.5: Search Tab', () => {
    beforeEach(() => {
      friendService.getFriends.mockResolvedValue({
        friends: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    it('should display search input in Search tab', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });
    });

    it('should debounce search queries by 300ms', async () => {
      jest.useFakeTimers();

      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search by username...');
      fireEvent.changeText(searchInput, 'test');

      // Should not call immediately
      expect(friendService.searchUsers).not.toHaveBeenCalled();

      // Fast-forward time by 300ms
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('test');
      });

      jest.useRealTimers();
    });

    it('should call searchUsers when query entered', async () => {
      jest.useFakeTimers();

      friendService.searchUsers.mockResolvedValue({
        users: [{ id: 10, username: 'testuser', full_name: 'Test User' }],
      });

      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search by username...');
      fireEvent.changeText(searchInput, 'testuser');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('testuser');
      });

      jest.useRealTimers();
    });

    it('should display search results in list', async () => {
      jest.useFakeTimers();

      friendService.searchUsers.mockResolvedValue({
        users: [
          { id: 10, username: 'testuser', full_name: 'Test User' },
          { id: 11, username: 'another', full_name: 'Another User' },
        ],
      });

      const { getByTestId, getByPlaceholderText, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search by username...');
      fireEvent.changeText(searchInput, 'test');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('Another User')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should display "Start typing to search" when no query', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByText('Start typing to search')).toBeTruthy();
      });
    });

    it('should display "No users found" when results empty', async () => {
      jest.useFakeTimers();

      friendService.searchUsers.mockResolvedValue({
        users: [],
      });

      const { getByTestId, getByPlaceholderText, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search by username...');
      fireEvent.changeText(searchInput, 'nonexistent');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(getByText('No users found')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should allow selecting users from search results', async () => {
      jest.useFakeTimers();

      friendService.searchUsers.mockResolvedValue({
        users: [{ id: 10, username: 'testuser', full_name: 'Test User' }],
      });

      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      await waitFor(() => {
        expect(getByPlaceholderText('Search by username...')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search by username...');
      fireEvent.changeText(searchInput, 'test');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(getByTestId('friend-row-10')).toBeTruthy();
      });

      const userRow = getByTestId('friend-row-10');
      fireEvent.press(userRow);

      const checkbox = getByTestId('checkbox-10');
      expect(checkbox.props.name).toBe('checkbox');

      jest.useRealTimers();
    });
  });

  describe('Sub-Slice 7.6: Guest Player Functionality', () => {
    beforeEach(() => {
      friendService.getFriends.mockResolvedValue({
        friends: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    it('should display guest input at bottom of Friends tab', async () => {
      const { getByPlaceholderText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Guest name...')).toBeTruthy();
      });
    });

    it('should add guest when "Add Guest" button pressed', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Guest name...')).toBeTruthy();
      });

      const guestInput = getByPlaceholderText('Guest name...');
      fireEvent.changeText(guestInput, 'John Doe');

      const addButton = getByTestId('add-guest-button');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });
    });

    it('should clear input after adding guest', async () => {
      const { getAllByPlaceholderText, getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getAllByPlaceholderText('Guest name...').length).toBeGreaterThan(0);
      });

      const guestInputs = getAllByPlaceholderText('Guest name...');
      const guestInput = guestInputs[0];
      fireEvent.changeText(guestInput, 'Jane Doe');

      const addButton = getByTestId('add-guest-button');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByText('Jane Doe')).toBeTruthy();
      });

      // After adding, the input should be cleared
      const newInputs = getAllByPlaceholderText('Guest name...');
      expect(newInputs[0].props.value).toBe('');
    });

    it('should disable Add Guest button when input empty', async () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        const addButton = getByTestId('add-guest-button');
        expect(addButton.props.accessibilityState.disabled).toBe(true);
      });
    });

    it('should display added guests in list with guest badge', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Guest name...')).toBeTruthy();
      });

      const guestInput = getByPlaceholderText('Guest name...');
      fireEvent.changeText(guestInput, 'Guest Player');

      const addButton = getByTestId('add-guest-button');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByText('Guest Player')).toBeTruthy();
        expect(getByText('GUEST')).toBeTruthy();
      });
    });

    it('should allow removing guests from list', async () => {
      const {
        getByPlaceholderText, getByTestId, getByText, queryByText,
      } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Guest name...')).toBeTruthy();
      });

      const guestInput = getByPlaceholderText('Guest name...');
      fireEvent.changeText(guestInput, 'Remove Me');

      const addButton = getByTestId('add-guest-button');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByText('Remove Me')).toBeTruthy();
      });

      const removeButton = getByTestId('remove-guest-0');
      fireEvent.press(removeButton);

      await waitFor(() => {
        expect(queryByText('Remove Me')).toBeNull();
      });
    });
  });

  describe('Sub-Slice 7.7: Footer and Confirmation', () => {
    const mockFriends = [
      { id: 1, username: 'friend1', full_name: 'Friend One' },
      { id: 2, username: 'friend2', full_name: 'Friend Two' },
    ];

    beforeEach(() => {
      friendService.getFriends.mockResolvedValue({
        friends: mockFriends,
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    it('should display selection counter in footer', async () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('selection-counter')).toBeTruthy();
      });
    });

    it('should update counter when selections change', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      // Initially 0 selected
      expect(getByText('0 selected')).toBeTruthy();

      // Select one friend
      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      await waitFor(() => {
        expect(getByText('1 selected')).toBeTruthy();
      });
    });

    it('should display Done button in footer', async () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('done-button')).toBeTruthy();
      });
    });

    it('should disable Done button when nothing selected', async () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        const doneButton = getByTestId('done-button');
        expect(doneButton.props.accessibilityState.disabled).toBe(true);
      });
    });

    it('should call onConfirm with correct format when Done pressed', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      // Select a friend
      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      await waitFor(() => {
        expect(getByText('1 selected')).toBeTruthy();
      });

      // Press Done
      const doneButton = getByTestId('done-button');
      fireEvent.press(doneButton);

      expect(mockOnConfirm).toHaveBeenCalledWith([{ userId: 1 }]);
    });

    it('should close modal after confirmation', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      // Select a friend
      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      // Press Done
      const doneButton = getByTestId('done-button');
      fireEvent.press(doneButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sub-Slice 7.8: Integration and Polish', () => {
    const mockFriends = [
      { id: 1, username: 'friend1', full_name: 'Friend One' },
    ];

    beforeEach(() => {
      friendService.getFriends.mockResolvedValue({
        friends: mockFriends,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    it('should persist selections when switching tabs', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        expect(getByText('Friend One')).toBeTruthy();
      });

      // Select friend
      const friendRow = getByTestId('friend-row-1');
      fireEvent.press(friendRow);

      // Should show 1 selected
      await waitFor(() => {
        expect(getByText('1 selected')).toBeTruthy();
      });

      // Switch to search tab
      const searchTab = getByTestId('tab-search');
      fireEvent.press(searchTab);

      // Counter should still show 1 selected
      expect(getByText('1 selected')).toBeTruthy();

      // Switch back to friends tab
      const friendsTab = getByTestId('tab-friends');
      fireEvent.press(friendsTab);

      // Selection should still be there
      await waitFor(() => {
        const checkbox = getByTestId('checkbox-1');
        expect(checkbox.props.name).toBe('checkbox');
      });
    });

    it('should handle accessibility labels correctly', async () => {
      const { getByTestId } = renderWithTheme(
        <PlayerSelectionModal
          visible
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          existingPlayers={[]}
        />,
      );

      await waitFor(() => {
        const doneButton = getByTestId('done-button');
        expect(doneButton.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
