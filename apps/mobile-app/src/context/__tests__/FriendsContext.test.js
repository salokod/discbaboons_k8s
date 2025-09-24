/**
 * FriendsContext Tests
 * Test suite for friends state management
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FriendsProvider, useFriends } from '../FriendsContext';

// Test component to consume the context
function TestComponent() {
  const {
    friends, requests, loading, error, dispatch,
  } = useFriends();

  // Expose dispatch for testing
  React.useEffect(() => {
    global.testDispatch = dispatch;
  }, [dispatch]);

  return (
    <>
      <Text testID="friends-count">{friends.list.length}</Text>
      <Text testID="incoming-requests-count">{requests.incoming.length}</Text>
      <Text testID="outgoing-requests-count">{requests.outgoing.length}</Text>
      <Text testID="requests-badge">{requests.badge}</Text>
      <Text testID="loading">{loading.toString()}</Text>
      <Text testID="error">{error || 'no-error'}</Text>
    </>
  );
}

describe('FriendsContext', () => {
  beforeEach(() => {
    global.testDispatch = null;
  });

  it('should provide initial state structure', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    expect(getByTestId('friends-count')).toHaveTextContent('0');
    expect(getByTestId('incoming-requests-count')).toHaveTextContent('0');
    expect(getByTestId('outgoing-requests-count')).toHaveTextContent('0');
    expect(getByTestId('requests-badge')).toHaveTextContent('0');
    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should throw error when useFriends is used outside of provider', () => {
    // Suppress console.error for this test as React will log the error
    // eslint-disable-next-line no-console
    const originalError = console.error;
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    expect(() => render(<TestComponent />)).toThrow('useFriends must be used within FriendsProvider');

    // eslint-disable-next-line no-console
    console.error = originalError;
  });

  it('should handle FETCH_FRIENDS_START action', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    act(() => {
      global.testDispatch({
        type: 'FETCH_FRIENDS_START',
      });
    });

    expect(getByTestId('loading')).toHaveTextContent('true');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle FETCH_FRIENDS_SUCCESS action', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    const mockFriends = [
      {
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
      },
    ];

    const mockPagination = {
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    };

    act(() => {
      global.testDispatch({
        type: 'FETCH_FRIENDS_SUCCESS',
        payload: {
          friends: mockFriends,
          pagination: mockPagination,
        },
      });
    });

    expect(getByTestId('friends-count')).toHaveTextContent('1');
    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle FETCH_FRIENDS_ERROR action', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    const errorMessage = 'Failed to load friends';

    act(() => {
      global.testDispatch({
        type: 'FETCH_FRIENDS_ERROR',
        payload: { message: errorMessage },
      });
    });

    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent(errorMessage);
  });

  it('should handle REFRESH_FRIENDS action', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    act(() => {
      global.testDispatch({
        type: 'REFRESH_FRIENDS',
      });
    });

    expect(getByTestId('loading')).toHaveTextContent('true');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle FETCH_REQUESTS_SUCCESS action', () => {
    const { getByTestId } = render(
      <FriendsProvider>
        <TestComponent />
      </FriendsProvider>,
    );

    const mockIncomingRequests = [
      {
        id: 456,
        requester_id: 789,
        recipient_id: 123,
        status: 'pending',
        requester: {
          id: 789,
          username: 'johndoe',
          email: 'johndoe@example.com',
        },
        created_at: '2024-01-15T10:30:00.000Z',
      },
    ];

    const mockOutgoingRequests = [
      {
        id: 789,
        requester_id: 123,
        recipient_id: 456,
        status: 'pending',
        recipient: {
          id: 456,
          username: 'janedoe',
          email: 'janedoe@example.com',
        },
        created_at: '2024-01-15T10:30:00.000Z',
      },
    ];

    act(() => {
      global.testDispatch({
        type: 'FETCH_REQUESTS_SUCCESS',
        payload: {
          incoming: mockIncomingRequests,
          outgoing: mockOutgoingRequests,
        },
      });
    });

    expect(getByTestId('incoming-requests-count')).toHaveTextContent('1');
    expect(getByTestId('outgoing-requests-count')).toHaveTextContent('1');
    expect(getByTestId('requests-badge')).toHaveTextContent('1');
  });
});
