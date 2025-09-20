/**
 * FriendsContext for friends state management
 * Handles friends list, requests, and social features
 */

import {
  createContext, useContext, useReducer, useMemo,
} from 'react';
import PropTypes from 'prop-types';

export const FriendsContext = createContext();

// Initial state
const initialState = {
  friends: {
    list: [],
    pagination: {},
    loading: false,
    lastRefresh: null,
    error: null,
  },
  requests: {
    incoming: [],
    outgoing: [],
    badge: 0,
    loading: false,
  },
  loading: false,
  error: null,
};

// Reducer function
function friendsReducer(state, action) {
  switch (action.type) {
    case 'FETCH_FRIENDS_START':
      return {
        ...state,
        friends: {
          ...state.friends,
          loading: true,
          error: null,
        },
        loading: true,
        error: null,
      };
    case 'FETCH_FRIENDS_SUCCESS':
      return {
        ...state,
        friends: {
          ...state.friends,
          list: action.payload.friends,
          pagination: action.payload.pagination,
          loading: false,
          error: null,
          lastRefresh: new Date().toISOString(),
        },
        loading: false,
        error: null,
      };
    case 'FETCH_FRIENDS_ERROR':
      return {
        ...state,
        friends: {
          ...state.friends,
          loading: false,
          error: action.payload.message,
        },
        loading: false,
        error: action.payload.message,
      };
    case 'REFRESH_FRIENDS':
      return {
        ...state,
        friends: {
          ...state.friends,
          loading: true,
          error: null,
        },
        loading: true,
        error: null,
      };
    case 'FETCH_REQUESTS_START':
      return {
        ...state,
        requests: {
          ...state.requests,
          loading: true,
        },
      };
    case 'FETCH_REQUESTS_SUCCESS':
      return {
        ...state,
        requests: {
          ...state.requests,
          incoming: action.payload.incoming,
          outgoing: action.payload.outgoing,
          badge: action.payload.incoming.length,
          loading: false,
        },
      };
    default:
      return state;
  }
}

export function FriendsProvider({ children }) {
  const [state, dispatch] = useReducer(friendsReducer, initialState);

  const value = useMemo(() => ({
    ...state,
    dispatch,
  }), [state]);

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}

FriendsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within FriendsProvider');
  }
  return context;
};
