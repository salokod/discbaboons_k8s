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
    processingRequests: new Set(), // Track which requests are being processed
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
    case 'CANCEL_REQUEST_START':
      return {
        ...state,
        requests: {
          ...state.requests,
          loading: true,
        },
      };
    case 'CANCEL_REQUEST_SUCCESS':
      return {
        ...state,
        requests: {
          ...state.requests,
          outgoing: state.requests.outgoing.filter(
            (request) => request.id !== action.payload.requestId,
          ),
          loading: false,
        },
      };
    case 'CANCEL_REQUEST_ERROR':
      return {
        ...state,
        requests: {
          ...state.requests,
          loading: false,
        },
      };
    case 'ACCEPT_REQUEST_OPTIMISTIC': {
      // Find the request being accepted to convert to friend
      const acceptedRequest = state.requests.incoming.find(
        (request) => request.id === action.payload.requestId,
      );
      if (!acceptedRequest) {
        return state; // Request not found, no change
      }

      // Create friend object from the request
      const newFriend = {
        id: acceptedRequest.requester.id,
        username: acceptedRequest.requester.username,
        email: acceptedRequest.requester.email,
        created_at: new Date().toISOString(),
      };

      // Add to processing requests and update state
      const updatedProcessingRequests = new Set(state.requests.processingRequests);
      updatedProcessingRequests.add(action.payload.requestId);

      return {
        ...state,
        friends: {
          ...state.friends,
          list: [...state.friends.list, newFriend],
        },
        requests: {
          ...state.requests,
          incoming: state.requests.incoming.filter(
            (request) => request.id !== action.payload.requestId,
          ),
          badge: state.requests.incoming.filter(
            (request) => request.id !== action.payload.requestId,
          ).length,
          processingRequests: updatedProcessingRequests,
        },
      };
    }
    case 'ACCEPT_REQUEST_START':
      return {
        ...state,
        requests: {
          ...state.requests,
          loading: true,
        },
      };
    case 'ACCEPT_REQUEST_SUCCESS': {
      // Clear the processing state for this request
      const successProcessingRequests = new Set(state.requests.processingRequests);
      successProcessingRequests.delete(action.payload.requestId);

      return {
        ...state,
        requests: {
          ...state.requests,
          processingRequests: successProcessingRequests,
          loading: false,
        },
        error: null, // Clear any previous errors
      };
    }
    case 'ACCEPT_REQUEST_ERROR': {
      // Revert optimistic update: restore the request and remove the friend
      const requestToRestore = action.payload.originalRequest;
      if (!requestToRestore) {
        // No original request data, just update loading state
        const noRequestProcessingRequests = new Set(state.requests.processingRequests);
        noRequestProcessingRequests.delete(action.payload.requestId);

        return {
          ...state,
          requests: {
            ...state.requests,
            loading: false,
            processingRequests: noRequestProcessingRequests,
          },
          error: action.payload.error || 'Failed to accept friend request',
        };
      }

      // Clear the processing state for this request
      const errorProcessingRequests = new Set(state.requests.processingRequests);
      errorProcessingRequests.delete(action.payload.requestId);

      return {
        ...state,
        friends: {
          ...state.friends,
          // Remove the optimistically added friend
          list: state.friends.list.filter(
            (friend) => friend.id !== requestToRestore.requester.id,
          ),
        },
        requests: {
          ...state.requests,
          // Restore the original request
          incoming: [...state.requests.incoming, requestToRestore],
          badge: state.requests.incoming.length + 1,
          loading: false,
          processingRequests: errorProcessingRequests,
        },
        error: action.payload.error || 'Failed to accept friend request',
      };
    }
    case 'DENY_REQUEST_START':
      return {
        ...state,
        requests: {
          ...state.requests,
          loading: true,
        },
      };
    case 'DENY_REQUEST_SUCCESS':
      return {
        ...state,
        requests: {
          ...state.requests,
          incoming: state.requests.incoming.filter(
            (request) => request.id !== action.payload.requestId,
          ),
          badge: state.requests.incoming.filter(
            (request) => request.id !== action.payload.requestId,
          ).length,
          loading: false,
        },
      };
    case 'DENY_REQUEST_ERROR':
      return {
        ...state,
        requests: {
          ...state.requests,
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
