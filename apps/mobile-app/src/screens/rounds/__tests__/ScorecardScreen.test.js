/**
 * ScorecardScreen Tests
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScorecardScreen from '../ScorecardScreen';
import * as roundService from '../../../services/roundService';

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
  }),
}));

jest.mock('../../../services/roundService', () => ({
  getRoundDetails: jest.fn(),
  getRoundPars: jest.fn(),
  submitScores: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../components/AppContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function AppContainer({ children }) {
    return React.createElement(View, { testID: 'app-container' }, children);
  };
});

jest.mock('../../../components/NavigationHeader', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function NavigationHeader({ title, testID }) {
    return React.createElement(
      View,
      { testID },
      React.createElement(Text, null, title),
    );
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: function GestureHandlerRootView({ children, style }) {
      return React.createElement(View, { style }, children);
    },
    PanGestureHandler: function PanGestureHandler({
      children, onHandlerStateChange, onGestureEvent, ...props
    }) {
      return React.createElement(View, {
        ...props,
        onHandlerStateChange,
        onGestureEvent,
      }, children);
    },
    State: {
      UNDETERMINED: 0,
      FAILED: 1,
      BEGAN: 2,
      CANCELLED: 3,
      ACTIVE: 4,
      END: 5,
    },
  };
});

describe('ScorecardScreen', () => {
  const mockRoute = {
    params: {
      roundId: 'round-123',
    },
  };

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockRoundData = {
    id: 'round-123',
    name: 'Test Round',
    course: {
      id: 'course-1',
      name: 'Test Course',
      holes: 18,
    },
    players: [
      { id: 1, username: 'player1', display_name: 'Player 1' },
      { id: 2, username: 'player2', display_name: 'Player 2' },
    ],
  };

  const mockPars = {
    1: 3,
    2: 4,
    3: 3,
    4: 4,
    5: 5,
  };

  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.getRoundPars.mockResolvedValue(mockPars);
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    jest.spyOn(Alert, 'alert');
  });

  it('should export a memoized component', () => {
    expect(typeof ScorecardScreen).toBe('object');
    expect(ScorecardScreen.displayName).toBe('ScorecardScreen');
  });

  it('should render scorecard screen', () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-screen')).toBeTruthy();
  });

  it('should display header', () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-header')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-loading')).toBeTruthy();
  });

  it('should render shimmer skeleton when loading', () => {
    const { getByTestId, getAllByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-loading')).toBeTruthy();
    expect(getByTestId('skeleton-hole-header')).toBeTruthy();
    expect(getAllByTestId('skeleton-player-row').length).toBeGreaterThan(0);
  });

  it('should call getRoundDetails with roundId on mount', async () => {
    renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(roundService.getRoundDetails).toHaveBeenCalledWith('round-123');
    });
  });

  it('should call getRoundPars with roundId on mount', async () => {
    renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(roundService.getRoundPars).toHaveBeenCalledWith('round-123');
    });
  });

  it('should clear loading state after data is loaded', async () => {
    const { queryByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(queryByTestId('scorecard-loading')).toBeNull();
    });
  });

  it('should display current hole number after data loads', async () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('current-hole-number')).toBeTruthy();
    });
  });

  it('should display par for current hole', async () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('current-hole-par')).toBeTruthy();
    });
  });

  it('should display current player name', async () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('current-player-name')).toBeTruthy();
    });
  });

  it('should display quick score buttons', async () => {
    const { getByTestId } = renderWithNavigation(
      <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('score-button--2')).toBeTruthy();
      expect(getByTestId('score-button--1')).toBeTruthy();
      expect(getByTestId('score-button-par')).toBeTruthy();
      expect(getByTestId('score-button-+1')).toBeTruthy();
      expect(getByTestId('score-button-+2')).toBeTruthy();
      expect(getByTestId('score-button-+3')).toBeTruthy();
    });
  });

  describe('AsyncStorage Score Persistence', () => {
    it('should load saved scores from AsyncStorage on mount', async () => {
      const savedScores = {
        1: { 1: 3, 2: 4 },
        2: { 1: 4, 2: 5 },
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedScores));

      renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@scorecard_scores_round-123');
      });
    });

    it('should save scores to AsyncStorage when score is entered', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button-par'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@scorecard_scores_round-123',
          expect.any(String),
        );
      });
    });

    it('should save scores in correct format', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button-par'));

      await waitFor(() => {
        const { calls } = AsyncStorage.setItem.mock;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        const savedData = JSON.parse(lastCall[1]);
        expect(savedData).toHaveProperty('1');
        expect(savedData[1]).toHaveProperty('1');
      });
    });
  });

  describe('Manual Hole Navigation', () => {
    it('should display Previous and Next buttons', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('previous-hole-button')).toBeTruthy();
        expect(getByTestId('next-hole-button')).toBeTruthy();
      });
    });

    it('should display Hole X of 18 indicator', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('hole-indicator')).toBeTruthy();
      });
    });

    it('should disable Previous button on hole 1', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const prevButton = getByTestId('previous-hole-button');
        expect(prevButton.props.accessibilityState.disabled).toBe(true);
      });
    });

    it('should navigate to next hole when Next button is pressed', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('next-hole-button'));

      await waitFor(() => {
        expect(getByText('Hole 2')).toBeTruthy();
      });
    });

    it('should navigate to previous hole when Previous button is pressed', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      // Navigate to hole 2 first
      fireEvent.press(getByTestId('next-hole-button'));

      await waitFor(() => {
        expect(getByText('Hole 2')).toBeTruthy();
      });

      // Navigate back to hole 1
      fireEvent.press(getByTestId('previous-hole-button'));

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });
    });

    it('should disable Next button on hole 18', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('next-hole-button')).toBeTruthy();
      });

      // Navigate to hole 18
      for (let i = 1; i < 18; i += 1) {
        fireEvent.press(getByTestId('next-hole-button'));
      }

      await waitFor(() => {
        const nextButton = getByTestId('next-hole-button');
        expect(nextButton.props.accessibilityState.disabled).toBe(true);
      });
    });
  });

  describe('Swipe Gesture Navigation', () => {
    it('should register swipe gesture handler', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('scorecard-swipe-container')).toBeTruthy();
      });
    });

    it('should navigate to next hole on swipe left with sufficient distance', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      const swipeContainer = getByTestId('scorecard-swipe-container');

      // Simulate swipe left (next hole) - trigger state change
      fireEvent(swipeContainer, 'onHandlerStateChange', {
        nativeEvent: {
          translationX: -60,
          state: 5, // END state
        },
      });

      await waitFor(() => {
        expect(getByText('Hole 2')).toBeTruthy();
      });
    });

    it('should navigate to previous hole on swipe right with sufficient distance', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      // Navigate to hole 2 first
      fireEvent.press(getByTestId('next-hole-button'));

      await waitFor(() => {
        expect(getByText('Hole 2')).toBeTruthy();
      });

      const swipeContainer = getByTestId('scorecard-swipe-container');

      // Simulate swipe right (previous hole) - trigger both handlers
      fireEvent(swipeContainer, 'onHandlerStateChange', {
        nativeEvent: {
          translationX: 60,
          state: 5, // END state
        },
      });

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });
    });

    it('should not navigate on swipe with insufficient distance', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      const swipeContainer = getByTestId('scorecard-swipe-container');

      // Simulate swipe left with insufficient distance
      fireEvent(swipeContainer, 'onHandlerStateChange', {
        nativeEvent: {
          translationX: -30, // Less than 50px threshold
          state: 5, // END state
        },
      });

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy(); // Still on hole 1
      });
    });

    it('should not navigate past hole 18 on swipe left', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      // Navigate to hole 18
      for (let i = 1; i < 18; i += 1) {
        fireEvent.press(getByTestId('next-hole-button'));
      }

      await waitFor(() => {
        expect(getByText('Hole 18')).toBeTruthy();
      });

      const swipeContainer = getByTestId('scorecard-swipe-container');

      // Attempt to swipe left on hole 18
      fireEvent(swipeContainer, 'onHandlerStateChange', {
        nativeEvent: {
          translationX: -60,
          state: 5, // END state
        },
      });

      await waitFor(() => {
        expect(getByText('Hole 18')).toBeTruthy(); // Still on hole 18
      });
    });

    it('should not navigate before hole 1 on swipe right', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy();
      });

      const swipeContainer = getByTestId('scorecard-swipe-container');

      // Attempt to swipe right on hole 1
      fireEvent(swipeContainer, 'onHandlerStateChange', {
        nativeEvent: {
          translationX: 60,
          state: 5, // END state
        },
      });

      await waitFor(() => {
        expect(getByText('Hole 1')).toBeTruthy(); // Still on hole 1
      });
    });
  });

  describe('Smart Confirmation for Outlier Scores', () => {
    it('should add +8 button for testing outlier scores', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Check for +8 button which will trigger outlier for par 3 (score 11 > 10)
        expect(getByTestId('score-button-+8')).toBeTruthy();
      });
    });

    it('should show confirmation alert for score greater than 10', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-+8')).toBeTruthy();
      });

      // Mock the alert
      Alert.alert.mockImplementation((title, message, buttons) => {
        expect(message).toContain('Score of 11 on Par 3');
        expect(message).toContain('This seems high');
        // Simulate pressing Cancel
        buttons[0].onPress();
      });

      // Enter score of 11 (par 3 + 8 = 11 > 10)
      fireEvent.press(getByTestId('score-button-+8'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should show confirmation alert for score greater than par+5', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Par 3')).toBeTruthy();
      });

      // Mock the alert to simulate pressing Confirm
      Alert.alert.mockImplementation((title, message, buttons) => {
        // Par 3 + 6 = 9, which is > par+5 (8)
        expect(message).toContain('Score of 9 on Par 3');
        expect(message).toContain('This seems high');
        // Simulate pressing Confirm
        buttons[1].onPress();
      });

      // Add +6 button for testing
      const plus6Button = getByTestId('score-button-+6');
      fireEvent.press(plus6Button);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('should add +6 button for testing par+5 threshold', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Check for +6 button which will trigger outlier for par 3 (score 9 > par+5)
        expect(getByTestId('score-button-+6')).toBeTruthy();
      });
    });

    it('should not save score if user cancels confirmation', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-+8')).toBeTruthy();
      });

      // Mock alert to cancel
      Alert.alert.mockImplementation((title, message, buttons) => {
        buttons[0].onPress(); // Cancel
      });

      const initialCallCount = AsyncStorage.setItem.mock.calls.length;

      // Try to enter outlier score
      fireEvent.press(getByTestId('score-button-+8'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Score should not be saved when cancelled
      // AsyncStorage.setItem should not be called after alert cancellation
      expect(AsyncStorage.setItem.mock.calls.length).toBe(initialCallCount);
    });

    it('should save score if user confirms outlier score', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-+8')).toBeTruthy();
      });

      // Mock alert to confirm
      Alert.alert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress(); // Confirm
        }
      });

      // Enter outlier score
      fireEvent.press(getByTestId('score-button-+8'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@scorecard_scores_round-123',
          expect.any(String),
        );
      });

      // Reset mock implementation
      Alert.alert.mockRestore();
      jest.spyOn(Alert, 'alert');
    });

    it('should not show alert for normal scores', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      // Enter normal score (par)
      fireEvent.press(getByTestId('score-button-par'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });

      // Alert should not be called for normal scores
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Visual Score Feedback', () => {
    it('should display score history section', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-history')).toBeTruthy();
      });
    });

    it('should show visual feedback after entering score', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button-par'));

      await waitFor(() => {
        // Check for icon in score history
        expect(getByText('●')).toBeTruthy();
      });
    });

    it('should display down arrow for under par scores', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button--1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button--1'));

      await waitFor(() => {
        expect(getByText('▼')).toBeTruthy();
      });
    });

    it('should display up arrow for over par scores', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-+1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button-+1'));

      await waitFor(() => {
        expect(getByText('▲')).toBeTruthy();
      });
    });

    it('should display dot for par scores', async () => {
      const { getByTestId, getByText } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      fireEvent.press(getByTestId('score-button-par'));

      await waitFor(() => {
        expect(getByText('●')).toBeTruthy();
      });
    });
  });

  describe('Score Submission', () => {
    beforeEach(() => {
      roundService.submitScores.mockResolvedValue({ success: true });
    });

    it('should submit scores when navigating to next hole', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      // Enter scores for both players on hole 1
      fireEvent.press(getByTestId('score-button-par')); // Player 1
      fireEvent.press(getByTestId('score-button-+1')); // Player 2

      await waitFor(() => {
        expect(roundService.submitScores).toHaveBeenCalledWith(
          'round-123',
          [
            { hole: 1, player_id: 1, score: 3 },
            { hole: 1, player_id: 2, score: 4 },
          ],
        );
      });
    });

    it('should not submit if any player has null score', async () => {
      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('next-hole-button')).toBeTruthy();
      });

      // Don't enter any scores, just try to navigate
      fireEvent.press(getByTestId('next-hole-button'));

      // Should not call submitScores
      expect(roundService.submitScores).not.toHaveBeenCalled();
    });

    it('should handle submit error gracefully', async () => {
      roundService.submitScores.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = renderWithNavigation(
        <ScorecardScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('score-button-par')).toBeTruthy();
      });

      // Enter scores for both players
      fireEvent.press(getByTestId('score-button-par')); // Player 1
      fireEvent.press(getByTestId('score-button-+1')); // Player 2

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to submit scores. Please try again.',
        );
      });
    });
  });
});
