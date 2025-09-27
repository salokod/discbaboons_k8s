/**
 * ParticipantSelector Tests
 */

import { waitFor, fireEvent } from '@testing-library/react-native';
import ParticipantSelector from '../ParticipantSelector';
import { renderWithTheme } from '../../../__tests__/integration/testUtils';

describe('ParticipantSelector', () => {
  const defaultProps = {
    selectedFriends: [],
    guests: [],
    onFriendsChange: jest.fn(),
    onGuestsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should export a ParticipantSelector component', () => {
    expect(ParticipantSelector).toBeDefined();
    // memo() returns an object, not a function, so we check for component type
    expect(ParticipantSelector.$$typeof).toBeTruthy();
  });

  it('should render with collapse button initially', async () => {
    const { getByTestId, getByText } = await renderWithTheme(
      <ParticipantSelector
        selectedFriends={defaultProps.selectedFriends}
        guests={defaultProps.guests}
        onFriendsChange={defaultProps.onFriendsChange}
        onGuestsChange={defaultProps.onGuestsChange}
      />,
    );

    expect(getByTestId('participant-selector')).toBeTruthy();
    expect(getByTestId('expand-participants')).toBeTruthy();
    expect(getByText('Add players (optional)')).toBeTruthy();
  });

  it('should expand to show friends section when toggle pressed', async () => {
    const { getByTestId, getByText } = await renderWithTheme(
      <ParticipantSelector
        selectedFriends={defaultProps.selectedFriends}
        guests={defaultProps.guests}
        onFriendsChange={defaultProps.onFriendsChange}
        onGuestsChange={defaultProps.onGuestsChange}
      />,
    );

    const expandButton = getByTestId('expand-participants');
    fireEvent.press(expandButton);

    await waitFor(() => {
      expect(getByText('Invite Friends')).toBeTruthy();
      expect(getByText('Add Guests')).toBeTruthy();
    });
  });

  it('should display selected friends count', async () => {
    const selectedFriends = [
      { id: 'user-1', username: 'john_doe', display_name: 'John Doe' },
    ];

    const { getByText } = await renderWithTheme(
      <ParticipantSelector
        selectedFriends={selectedFriends}
        guests={defaultProps.guests}
        onFriendsChange={defaultProps.onFriendsChange}
        onGuestsChange={defaultProps.onGuestsChange}
      />,
    );

    expect(getByText('1')).toBeTruthy(); // count badge
    expect(getByText('1 player added')).toBeTruthy();
  });
});
