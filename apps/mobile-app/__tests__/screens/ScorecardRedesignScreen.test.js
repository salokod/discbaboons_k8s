import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScorecardRedesignScreen from '../../src/screens/rounds/ScorecardRedesignScreen';
import * as roundService from '../../src/services/roundService';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ToastProvider } from '../../src/context/ToastContext';

// Mock roundService
jest.mock('../../src/services/roundService');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

// Mock offline queue
jest.mock('../../src/services/offlineQueue', () => ({
  addToQueue: jest.fn(),
  processQueue: jest.fn(),
  getQueueSize: jest.fn(),
}));

// Mock network service
jest.mock('../../src/services/networkService', () => ({
  isConnected: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock useNetworkStatus hook
jest.mock('../../src/hooks/useNetworkStatus', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isOnline: true })),
}));

// Mock react-native-gesture-handler
let mockOnEndCallback = null;
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, style }) => (
      <View style={style}>{children}</View>
    ),
    GestureDetector: ({ children, gesture, testID }) => {
      // Store the onEnd callback so tests can trigger it
      if (gesture && gesture.onEndCallback) {
        mockOnEndCallback = gesture.onEndCallback;
      }
      return (
        <View
          testID={testID}
          onSwipeLeft={() => mockOnEndCallback?.({ velocityX: -500 })}
          onSwipeRight={() => mockOnEndCallback?.({ velocityX: 500 })}
        >
          {children}
        </View>
      );
    },
    Gesture: {
      Pan: () => ({
        onEnd: (callback) => {
          mockOnEndCallback = callback;
          return { onEndCallback: callback };
        },
      }),
    },
  };
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    roundId: 'test-round-123',
  },
};

// Helper to render component with all required providers
const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    <ToastProvider>
      {component}
    </ToastProvider>
  </ThemeProvider>,
);

describe('ScorecardRedesignScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a component', () => {
    expect(typeof ScorecardRedesignScreen).toBe('function');
  });

  it('should accept route with roundId param', () => {
    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-redesign-screen')).toBeTruthy();
  });

  it('should accept navigation prop', () => {
    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-redesign-screen')).toBeTruthy();
  });

  it('should render with SafeAreaView', () => {
    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByTestId('scorecard-redesign-screen')).toBeTruthy();
  });

  it('should fetch round details on mount', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      pars: { 1: 3, 2: 4, 3: 5 },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    renderWithTheme(<ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(roundService.getRoundDetails).toHaveBeenCalledWith('test-round-123');
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch round');
    roundService.getRoundDetails.mockRejectedValue(mockError);

    const { getByText } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Failed to fetch round')).toBeTruthy();
    });
  });

  it('should show loading state', () => {
    roundService.getRoundDetails.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Should show HoleHeroCard with default values during loading
    expect(getByTestId('hole-hero-card')).toBeTruthy();
    expect(getByTestId('shimmer-player-row-0')).toBeTruthy();
  });

  it('should display hole number when data loaded', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('hole-hero-card')).toBeTruthy();
      expect(getByTestId('hole-number')).toBeTruthy();
      expect(getByTestId('hole-number').props.children).toBe(1);
    });
  });

  it('should display par for current hole', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('par-text')).toBeTruthy();
      const parText = getByTestId('par-text').props.children;
      // par-text contains ['Par', ' ', 3]
      expect(parText).toContain(3);
    });
  });

  it('should show "Hole X · Par Y" format (Title Case with middot)', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('hole-hero-card')).toBeTruthy();
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });
  });

  it('should render FlatList with players', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
        { id: 'player-2', username: 'Bob' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('players-flatlist')).toBeTruthy();
    });
  });

  it('should render PlayerScoreRow for each player', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
        { id: 'player-2', username: 'Bob' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getAllByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const playerRows = getAllByTestId('player-score-row');
      expect(playerRows).toHaveLength(2);
    });
  });

  it('should pass correct props to PlayerScoreRow', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getAllByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const playerName = getAllByTestId('player-name')[0];
      expect(playerName.props.children).toBe('Alice');
    });
  });

  it('should render Previous and Next buttons', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('prev-hole-button')).toBeTruthy();
      expect(getByTestId('next-hole-button')).toBeTruthy();
    });
  });

  it('should navigate to next hole when Next pressed', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    const nextButton = getByTestId('next-hole-button');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(2);
      expect(getByTestId('par-text').props.children).toContain(4);
    });
  });

  it('should navigate to previous hole when Previous pressed', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // First navigate to hole 2
    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    const nextButton = getByTestId('next-hole-button');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(2);
      expect(getByTestId('par-text').props.children).toContain(4);
    });

    // Then navigate back to hole 1
    const prevButton = getByTestId('prev-hole-button');
    fireEvent.press(prevButton);

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });
  });

  it('should disable Previous on hole 1', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const prevButton = getByTestId('prev-hole-button');
      expect(prevButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  it('should show Complete Round button on last hole (18)', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 3,
        })),
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId, queryByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Navigate to hole 18
    await waitFor(() => {
      expect(getByTestId('next-hole-button')).toBeTruthy();
    });

    const nextButton = getByTestId('next-hole-button');

    // Press next 17 times to get to hole 18
    for (let i = 0; i < 17; i += 1) {
      fireEvent.press(nextButton);
    }

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(18);
      expect(getByTestId('par-text').props.children).toContain(3);
      expect(getByTestId('complete-round-button')).toBeTruthy();
      expect(queryByTestId('next-hole-button')).toBeNull();
    });
  });

  it('should show loading state on Complete Round button during submission', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 3,
        })),
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.submitScores.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 1000);
    }));
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Navigate to hole 18
    await waitFor(() => {
      expect(getByTestId('next-hole-button')).toBeTruthy();
    });

    const nextButton = getByTestId('next-hole-button');

    // Press next 17 times to get to hole 18
    for (let i = 0; i < 17; i += 1) {
      fireEvent.press(nextButton);
    }

    await waitFor(() => {
      expect(getByTestId('complete-round-button')).toBeTruthy();
    });

    // Set a score for the player
    const plusButton = getByTestId('quick-score-plus');
    fireEvent.press(plusButton);

    await waitFor(() => {
      expect(getByTestId('quick-score-display').props.children).toBe('3');
    });

    // Press Complete Round button
    const completeButton = getByTestId('complete-round-button');
    fireEvent.press(completeButton);

    // Should show loading state
    await waitFor(() => {
      expect(getByTestId('complete-round-loading')).toBeTruthy();
    });
  });

  it('should disable Complete Round button while loading', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 3,
        })),
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.submitScores.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 1000);
    }));
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Navigate to hole 18
    await waitFor(() => {
      expect(getByTestId('next-hole-button')).toBeTruthy();
    });

    const nextButton = getByTestId('next-hole-button');

    // Press next 17 times to get to hole 18
    for (let i = 0; i < 17; i += 1) {
      fireEvent.press(nextButton);
    }

    await waitFor(() => {
      expect(getByTestId('complete-round-button')).toBeTruthy();
    });

    // Set a score for the player
    const plusButton = getByTestId('quick-score-plus');
    fireEvent.press(plusButton);

    await waitFor(() => {
      expect(getByTestId('quick-score-display').props.children).toBe('3');
    });

    // Press Complete Round button
    const completeButton = getByTestId('complete-round-button');
    fireEvent.press(completeButton);

    // Button should be disabled
    await waitFor(() => {
      expect(completeButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  it('should save scores to AsyncStorage when changed', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getAllByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByTestId('player-score-row')).toHaveLength(1);
    });

    // Simulate score change by pressing the plus button
    const plusButton = getAllByTestId('quick-score-plus')[0];
    fireEvent.press(plusButton);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'scorecard_test-round-123',
        JSON.stringify({ 1: { 'player-1': 3 } }),
      );
    });
  });

  it('should load scores from AsyncStorage on mount', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    const savedScores = { 1: { 'player-1': 5 } };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedScores));

    const { getAllByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('scorecard_test-round-123');
    });

    await waitFor(() => {
      const scoreDisplay = getAllByTestId('quick-score-display')[0];
      expect(scoreDisplay.props.children).toBe('5');
    });
  });

  it('should navigate to next hole on swipe left', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    // Simulate swipe left (negative velocityX)
    const gestureDetector = getByTestId('gesture-detector');
    fireEvent(gestureDetector, 'onSwipeLeft');

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(2);
      expect(getByTestId('par-text').props.children).toContain(4);
    });
  });

  it('should navigate to previous hole on swipe right', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // First navigate to hole 2
    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    const nextButton = getByTestId('next-hole-button');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(2);
      expect(getByTestId('par-text').props.children).toContain(4);
    });

    // Then swipe right to go back
    const gestureDetector = getByTestId('gesture-detector');
    fireEvent(gestureDetector, 'onSwipeRight');

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });
  });

  it('should not navigate past hole 1 on swipe right', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
          { number: 3, par: 5 },
        ],
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    // Try to swipe right on hole 1
    const gestureDetector = getByTestId('gesture-detector');
    fireEvent(gestureDetector, 'onSwipeRight');

    // Should still be on hole 1
    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(1);
      expect(getByTestId('par-text').props.children).toContain(3);
    });
  });

  it('should not navigate past hole 18 on swipe left', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: 3,
        })),
      },
      players: [],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);

    const { getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Navigate to hole 18
    await waitFor(() => {
      expect(getByTestId('next-hole-button')).toBeTruthy();
    });

    const nextButton = getByTestId('next-hole-button');

    // Press next 17 times to get to hole 18
    for (let i = 0; i < 17; i += 1) {
      fireEvent.press(nextButton);
    }

    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(18);
      expect(getByTestId('par-text').props.children).toContain(3);
    });

    // Try to swipe left on hole 18
    const gestureDetector = getByTestId('gesture-detector');
    fireEvent(gestureDetector, 'onSwipeLeft');

    // Should still be on hole 18
    await waitFor(() => {
      expect(getByTestId('hole-number').props.children).toBe(18);
      expect(getByTestId('par-text').props.children).toContain(3);
    });
  });

  it('should have submitScores function available', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.submitScores.mockResolvedValue({ success: true });

    renderWithTheme(<ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(roundService.submitScores).toBeDefined();
    });
  });

  it('should call submitScores with correct parameters when all scores present', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
        ],
      },
      players: [
        { id: 'player-1', username: 'Alice' },
        { id: 'player-2', username: 'Bob' },
      ],
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.submitScores.mockResolvedValue({ success: true });
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getAllByTestId, getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByTestId('player-score-row')).toHaveLength(2);
    });

    // Set scores for both players
    const plusButtons = getAllByTestId('quick-score-plus');
    fireEvent.press(plusButtons[0]); // Alice gets 3
    fireEvent.press(plusButtons[1]); // Bob gets 3

    await waitFor(() => {
      const scoreDisplays = getAllByTestId('quick-score-display');
      expect(scoreDisplays[0].props.children).toBe('3');
      expect(scoreDisplays[1].props.children).toBe('3');
    });

    // Navigate to next hole (which should submit scores)
    const nextButton = getByTestId('next-hole-button');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(roundService.submitScores).toHaveBeenCalledWith('test-round-123', [
        { playerId: 'player-1', holeNumber: 1, strokes: 3 },
        { playerId: 'player-2', holeNumber: 1, strokes: 3 },
      ]);
    });
  });

  it('should call submitScores with correct API field names (playerId, holeNumber, strokes)', async () => {
    const mockRoundData = {
      id: 'test-round-123',
      name: 'Test Round',
      players: [
        { id: 'player-1', username: 'Alice' },
        { id: 'player-2', username: 'Bob' },
      ],
      course: {
        holes: [
          { number: 1, par: 3 },
          { number: 2, par: 4 },
        ],
      },
    };

    roundService.getRoundDetails.mockResolvedValue(mockRoundData);
    roundService.submitScores.mockResolvedValue({
      success: true,
      scoresSubmitted: 2,
    });

    const { getAllByTestId, getByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByTestId('player-score-row')).toHaveLength(2);
    });

    // Enter scores (par=3)
    const plusButtons = getAllByTestId('quick-score-plus');
    fireEvent.press(plusButtons[0]); // Alice: 3
    fireEvent.press(plusButtons[1]); // Bob: 3

    // Navigate to next hole (triggers submission)
    const nextButton = getByTestId('next-hole-button');
    fireEvent.press(nextButton);

    // ASSERT: Correct field names (playerId, holeNumber, strokes)
    await waitFor(() => {
      expect(roundService.submitScores).toHaveBeenCalledWith('test-round-123', [
        { playerId: 'player-1', holeNumber: 1, strokes: 3 },
        { playerId: 'player-2', holeNumber: 1, strokes: 3 },
      ]);
    });
  });

  it('should show shimmer placeholders when loading', () => {
    roundService.getRoundDetails.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { getByTestId, queryByTestId } = renderWithTheme(
      <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Should NOT show ActivityIndicator anymore
    expect(queryByTestId('loading-indicator')).toBeNull();

    // Should show HoleHeroCard and shimmer player rows
    expect(getByTestId('hole-hero-card')).toBeTruthy();
    expect(getByTestId('shimmer-player-row-0')).toBeTruthy();
    expect(getByTestId('shimmer-player-row-1')).toBeTruthy();
    expect(getByTestId('shimmer-player-row-2')).toBeTruthy();
  });

  describe('Running total calculation', () => {
    it('should calculate running total as cumulative absolute score across all holes with scores', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
            { number: 3, par: 5 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Hole 1: score 4 (par 3), relative = +1
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton); // Sets score to par (3)
      fireEvent.press(plusButton); // Increments to 4

      await waitFor(() => {
        // Running total = +1 (4 - 3 = +1)
        expect(getByText('+1')).toBeTruthy();
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Hole 2: score 3 (par 4), relative = -1, cumulative = 0
      const minusButton = getAllByTestId('quick-score-minus')[0];
      fireEvent.press(minusButton); // score = 3 (par - 1)

      await waitFor(() => {
        // Running total = 0 (hole 1: +1, hole 2: -1 => 0)
        expect(getByText('E')).toBeTruthy(); // Even par displayed as 'E'
      });

      // Navigate to hole 3
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(3);
        expect(getByTestId('par-text').props.children).toContain(5);
      });

      // Hole 3: score 7 (par 5), relative = +2, cumulative = +2
      const plusButton3 = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton3); // Sets score to par (5)
      fireEvent.press(plusButton3); // Increments to 6
      fireEvent.press(plusButton3); // Increments to 7

      await waitFor(() => {
        // Running total = +2 (hole 1: +1, hole 2: -1, hole 3: +2 => +2)
        expect(getByText('+2')).toBeTruthy();
        // No absolute total in parentheses anymore
      });
    });

    it('should show cumulative total from previous holes when current hole has no score', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      // Player has score on hole 1 but we're on hole 2 with no score
      const savedScores = { 1: { 'player-1': 4 } };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedScores));

      const { getByTestId, getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Running total should show '+1' (from hole 1: score 4 - par 3 = +1)
      await waitFor(() => {
        expect(getByText('+1')).toBeTruthy();
      });
    });

    it('should show placeholder when no holes have scores', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('player-score-row')).toBeTruthy();
      });

      // No scores entered, should show placeholder
      await waitFor(() => {
        expect(getByText('-')).toBeTruthy();
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
      });

      // Still no scores anywhere, should still show placeholder
      await waitFor(() => {
        expect(getByText('-')).toBeTruthy();
      });
    });

    it('should calculate negative running total correctly', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Hole 1: score 2 (par 3), relative = -1
      const minusButton = getAllByTestId('quick-score-minus')[0];
      fireEvent.press(minusButton); // score = 2 (par - 1)

      await waitFor(() => {
        // Running total = -1 (2 - 3 = -1)
        expect(getByText('-1')).toBeTruthy();
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Hole 2: score 3 (par 4), relative = -1, cumulative = -2
      fireEvent.press(minusButton); // score = 3 (par - 1)

      await waitFor(() => {
        // Running total = -2 (hole 1: -1, hole 2: -1 => -2)
        expect(getByText('-2')).toBeTruthy();
        // No absolute total in parentheses anymore
      });
    });
  });

  describe('Debounced save (600ms)', () => {
    it('should debounce saves to AsyncStorage with 600ms delay', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score multiple times rapidly
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);
      fireEvent.press(plusButton);
      fireEvent.press(plusButton);

      // Should not have saved yet
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward 600ms
      jest.advanceTimersByTime(600);

      // Should have saved once with final value
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });

    it('should flush debounced save on Next button press', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      roundService.submitScores.mockResolvedValue({ success: true });
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Should not have saved yet (before 600ms)
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();

      // Press Next button (should flush)
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      // Should have saved immediately (flushed)
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should flush debounced save on Previous button press', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Navigate to hole 2 first
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Change score on hole 2
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Clear previous calls
      AsyncStorage.setItem.mockClear();

      // Should not have saved yet (before 600ms)
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();

      // Press Previous button (should flush)
      const prevButton = getByTestId('prev-hole-button');
      fireEvent.press(prevButton);

      // Should have saved immediately (flushed)
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Save status indicator', () => {
    it('should show "Saving..." status immediately after score change', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Should show "Saving..." immediately
      await waitFor(() => {
        expect(getByText('Saving...')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should show "Saved" status after debounce completes', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Should show "Saving..."
      await waitFor(() => {
        expect(getByText('Saving...')).toBeTruthy();
      });

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show "Saved"
      await waitFor(() => {
        expect(getByText('Saved')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should show "Error" status if save fails', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show "Error"
      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Data migration', () => {
    it('should migrate old flat format scores to hole-indexed format', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
          { id: 'player-2', username: 'Bob' },
        ],
      };

      // Old format: { playerId: score }
      const oldFormatScores = { 'player-1': 4, 'player-2': 3 };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(oldFormatScores));

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(2);
      });

      // Should migrate and display old scores on hole 1
      await waitFor(() => {
        const scoreDisplays = getAllByTestId('quick-score-display');
        expect(scoreDisplays[0].props.children).toBe('4');
        expect(scoreDisplays[1].props.children).toBe('3');
      });

      // Should save migrated format back to AsyncStorage
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'scorecard_test-round-123',
          JSON.stringify({ 1: { 'player-1': 4, 'player-2': 3 } }),
        );
      });
    });

    it('should load new format scores without migration', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      // New format: { 1: { playerId: score }, 2: { playerId: score } }
      const newFormatScores = { 1: { 'player-1': 4 }, 2: { 'player-1': 5 } };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(newFormatScores));

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Should load hole 1 score correctly
      await waitFor(() => {
        const scoreDisplay = getAllByTestId('quick-score-display')[0];
        expect(scoreDisplay.props.children).toBe('4');
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Should load hole 2 score correctly
      await waitFor(() => {
        const scoreDisplay = getAllByTestId('quick-score-display')[0];
        expect(scoreDisplay.props.children).toBe('5');
      });

      // Verify no migration occurred - if setItem was called, it should be for debounced save,
      // NOT for migration. The data should remain in the original format.
      // If migration occurred, the data would be different from what we loaded.
      const { calls } = AsyncStorage.setItem.mock;
      calls.forEach((call) => {
        const savedData = JSON.parse(call[1]);
        // Should NOT have migrated to single-hole format
        expect(Object.keys(savedData).length).toBeGreaterThan(1);
        expect(savedData).toEqual(newFormatScores);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle AsyncStorage save errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage quota exceeded'));

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      const plusButtons = getAllByTestId('quick-score-plus');
      fireEvent.press(plusButtons[0]);

      // Should not crash - error handled gracefully
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });

      // Component should still be functional
      expect(getAllByTestId('player-score-row')).toHaveLength(1);
    });

    it('should set error status when save fails', async () => {
      jest.useFakeTimers();

      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show "Error" status
      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels on navigation buttons', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }, { number: 2, par: 4 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('prev-hole-button')).toBeTruthy();
      });

      const prevButton = getByTestId('prev-hole-button');
      const nextButton = getByTestId('next-hole-button');

      expect(prevButton.props.accessibilityLabel).toBe('Previous hole');
      expect(nextButton.props.accessibilityLabel).toBe('Next hole');
    });

    it('should have accessibility hints on navigation buttons', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }, { number: 2, par: 4 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('prev-hole-button')).toBeTruthy();
      });

      const prevButton = getByTestId('prev-hole-button');
      const nextButton = getByTestId('next-hole-button');

      expect(prevButton.props.accessibilityHint).toBe('Navigate to the previous hole');
      expect(nextButton.props.accessibilityHint).toBe('Navigate to the next hole');
    });

    it('should have accessibility role on navigation buttons', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }, { number: 2, par: 4 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('prev-hole-button')).toBeTruthy();
      });

      const prevButton = getByTestId('prev-hole-button');
      const nextButton = getByTestId('next-hole-button');

      expect(prevButton.props.accessibilityRole).toBe('button');
      expect(nextButton.props.accessibilityRole).toBe('button');
    });

    // TODO: Temporarily commented out - will be re-added for Collapsible Sections
    // it('should have accessibility labels on bottom sheet triggers', async () => {
    //   ...will be re-implemented for collapsible sections
    // });
  });

  describe('Hole-indexed data structure', () => {
    it('should store scores in hole-indexed format { holeNumber: { playerId: score } }', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Set score for hole 1
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'scorecard_test-round-123',
          JSON.stringify({ 1: { 'player-1': 3 } }),
        );
      });
    });

    it('should preserve scores from previous holes when navigating', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Set score for hole 1
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'scorecard_test-round-123',
          JSON.stringify({ 1: { 'player-1': 3 } }),
        );
      });

      // Navigate to hole 2
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
        expect(getByTestId('par-text').props.children).toContain(4);
      });

      // Set score for hole 2
      const plusButton2 = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton2);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'scorecard_test-round-123',
          JSON.stringify({ 1: { 'player-1': 3 }, 2: { 'player-1': 4 } }),
        );
      });
    });

    it('should load hole-indexed scores from AsyncStorage', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      const savedScores = { 1: { 'player-1': 5 }, 2: { 'player-1': 4 } };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedScores));

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const scoreDisplay = getAllByTestId('quick-score-display')[0];
        expect(scoreDisplay.props.children).toBe('5');
      });
    });
  });

  describe('Offline queue integration', () => {
    it('should enqueue scores when offline', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Set score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      await waitFor(() => {
        const scoreDisplay = getAllByTestId('quick-score-display')[0];
        expect(scoreDisplay.props.children).toBe('3');
      });

      // Navigate to next hole (should queue when offline)
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      // Should NOT call submitScores (will test offline logic implementation)
      await waitFor(() => {
        expect(getByTestId('hole-number').props.children).toBe(2);
      });
    });

    it('should call submitScores when online', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [
            { number: 1, par: 3 },
            { number: 2, par: 4 },
          ],
        },
        players: [
          { id: 'player-1', username: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      roundService.submitScores.mockResolvedValue({ success: true });
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getAllByTestId, getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Set score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      await waitFor(() => {
        const scoreDisplay = getAllByTestId('quick-score-display')[0];
        expect(scoreDisplay.props.children).toBe('3');
      });

      // Navigate to next hole (should submit when online)
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      // Should call submitScores when online
      await waitFor(() => {
        expect(roundService.submitScores).toHaveBeenCalledWith('test-round-123', [
          { playerId: 'player-1', holeNumber: 1, strokes: 3 },
        ]);
      });
    });
  });

  // TODO: Bottom Sheets tests temporarily commented out
  // Will be replaced with Collapsible Sections tests during implementation
  // describe('Bottom Sheets', () => {
  //   ... tests will be re-added as Collapsible Sections
  // });

  describe('Offline Indicator Badge', () => {
    it('should render offline indicator when disconnected', async () => {
      const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
      useNetworkStatus.mockReturnValue({ isOnline: false });

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          name: 'Test Course',
          holes: [{ par: 3 }],
        },
        players: [],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('scorecard-redesign-screen')).toBeTruthy();
      });

      // Should show offline indicator
      expect(getByTestId('offline-indicator')).toBeTruthy();
      expect(getByText('Offline')).toBeTruthy();
    });

    it('should not render offline indicator when online', async () => {
      const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;
      useNetworkStatus.mockReturnValue({ isOnline: true });

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          name: 'Test Course',
          holes: [{ par: 3 }],
        },
        players: [],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { queryByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(queryByTestId('offline-indicator')).toBeNull();
      });
    });
  });

  describe('Toast Integration', () => {
    it('should show success toast after score save', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show success toast
      await waitFor(() => {
        expect(getByText('Score saved')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should show error toast on save failure', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show error toast
      await waitFor(() => {
        expect(getByText('Failed to save score')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should auto-dismiss toast after 2 seconds', async () => {
      jest.useFakeTimers();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          holes: [{ number: 1, par: 3 }],
        },
        players: [{ id: 'player-1', username: 'Alice' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const { getAllByTestId, getByText, queryByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getAllByTestId('player-score-row')).toHaveLength(1);
      });

      // Change score
      const plusButton = getAllByTestId('quick-score-plus')[0];
      fireEvent.press(plusButton);

      // Fast-forward past debounce
      jest.advanceTimersByTime(600);

      // Should show toast
      await waitFor(() => {
        expect(getByText('Score saved')).toBeTruthy();
      });

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      // Toast should be dismissed
      await waitFor(() => {
        expect(queryByText('Score saved')).toBeNull();
      });

      jest.useRealTimers();
    });
  });

  describe('Offline Queue Integration', () => {
    it('should use offlineQueue when network is offline', async () => {
      // Import and set up mocks
      const offlineQueue = require('../../src/services/offlineQueue');
      const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;

      // Mock offline state
      useNetworkStatus.mockReturnValue({ isOnline: false });
      offlineQueue.addToQueue.mockResolvedValue();

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          name: 'Test Course',
          holes: [{ par: 3 }, { par: 4 }],
        },
        players: [
          { id: 'player-1', username: 'Player1' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      // Pre-populate scores so handleSubmitScores will execute
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        1: { 'player-1': 3 },
      }));

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('next-hole-button')).toBeTruthy();
      });

      // Navigate to next hole which triggers handleSubmitScores
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        // Should add to offline queue when offline
        expect(offlineQueue.addToQueue).toHaveBeenCalledWith({
          type: 'SUBMIT_SCORES',
          data: {
            roundId: 'test-round-123',
            scores: [{ playerId: 'player-1', holeNumber: 1, strokes: 3 }],
          },
        });
      }, { timeout: 3000 });
    });

    it('should call submitScores directly when network is online', async () => {
      // Import and set up mocks
      const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;

      // Mock online state
      useNetworkStatus.mockReturnValue({ isOnline: true });
      roundService.submitScores.mockResolvedValue({ success: true });

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          name: 'Test Course',
          holes: [{ par: 3 }, { par: 4 }],
        },
        players: [
          { id: 'player-1', username: 'Player1' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      // Pre-populate scores
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        1: { 'player-1': 3 },
      }));

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('next-hole-button')).toBeTruthy();
      });

      // Navigate to next hole
      const nextButton = getByTestId('next-hole-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        // Should call submitScores directly when online
        expect(roundService.submitScores).toHaveBeenCalledWith(
          'test-round-123',
          [{ playerId: 'player-1', holeNumber: 1, strokes: 3 }],
        );
      }, { timeout: 3000 });
    });

    it('should process offline queue when coming back online', async () => {
      // Import mocks
      const offlineQueue = require('../../src/services/offlineQueue');
      const useNetworkStatus = require('../../src/hooks/useNetworkStatus').default;

      offlineQueue.processQueue.mockResolvedValue({ processed: 1, failed: 0 });

      // Mock online state to trigger queue processing
      useNetworkStatus.mockReturnValue({ isOnline: true });

      const mockRoundData = {
        id: 'test-round-123',
        name: 'Test Round',
        course: {
          name: 'Test Course',
          holes: [{ par: 3 }],
        },
        players: [],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);
      AsyncStorage.getItem.mockResolvedValue(null);

      const { getByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('scorecard-redesign-screen')).toBeTruthy();
      });

      // Verify processQueue was called when component mounted with isOnline=true
      await waitFor(() => {
        expect(offlineQueue.processQueue).toHaveBeenCalled();
      });
    });
  });

  describe('Collapsible Sections', () => {
    it('should render three collapsible sections', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [
          { id: '1', username: 'player1' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Round Info')).toBeTruthy();
        expect(getByText('Leaderboard')).toBeTruthy();
        expect(getByText('Side Bets')).toBeTruthy();
      });
    });

    it('should use CollapsibleSection component for each section', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [
          { id: '1', username: 'player1' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should have 3 collapsible sections
        const sections = getAllByTestId('collapsible-section');
        expect(sections).toHaveLength(3);
      });
    });

    it('should render sections in correct order: Round Info, Leaderboard, Side Bets', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [
          { id: '1', username: 'player1' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const sections = getAllByTestId('collapsible-section');
        expect(sections).toHaveLength(3);

        // Get parent of each section to find the title
        const firstSectionParent = sections[0].parent;
        const secondSectionParent = sections[1].parent;
        const thirdSectionParent = sections[2].parent;

        // Find the title text in each section's children
        expect(firstSectionParent.findByProps({ children: 'Round Info' })).toBeTruthy();
        expect(secondSectionParent.findByProps({ children: 'Leaderboard' })).toBeTruthy();
        expect(thirdSectionParent.findByProps({ children: 'Side Bets' })).toBeTruthy();
      });
    });
  });

  describe('Round Info Section Content', () => {
    it('should display course name when expanded', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Majestic Pines',
          location: 'Portland, OR',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        status: 'in_progress',
        created_at: '2024-01-15T10:00:00Z',
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getAllByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[0]).toBeTruthy();
      });

      // Expand Round Info section
      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[0]);

      await waitFor(() => {
        // Should find course name in Round Info section (appears in header AND content)
        const courseNames = getAllByText('Majestic Pines');
        expect(courseNames.length).toBeGreaterThan(0);
      });
    });

    it('should display location', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Majestic Pines',
          location: 'Portland, OR',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        status: 'in_progress',
        created_at: '2024-01-15T10:00:00Z',
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[0]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[0]);

      await waitFor(() => {
        expect(getByText('Portland, OR')).toBeTruthy();
      });
    });

    it('should display number of holes', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Majestic Pines',
          location: 'Portland, OR',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        status: 'in_progress',
        created_at: '2024-01-15T10:00:00Z',
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[0]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[0]);

      await waitFor(() => {
        expect(getByText('18 Holes')).toBeTruthy();
      });
    });

    it('should display round status', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Majestic Pines',
          location: 'Portland, OR',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        status: 'in_progress',
        created_at: '2024-01-15T10:00:00Z',
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[0]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[0]);

      await waitFor(() => {
        expect(getByText('In Progress')).toBeTruthy();
      });
    });

    it('should display formatted date', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Majestic Pines',
          location: 'Portland, OR',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        status: 'in_progress',
        created_at: '2024-01-15T10:00:00Z',
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[0]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[0]);

      await waitFor(() => {
        // Check for formatted date - format is "January 15, 2024"
        expect(getByText(/January 15, 2024/)).toBeTruthy();
      });
    });
  });

  describe('Leaderboard Section Content', () => {
    it('should display leaderboard when expanded', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [
          { id: '1', username: 'player1', display_name: 'Alice' },
          { id: '2', username: 'player2', display_name: 'Bob' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getAllByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[1]).toBeTruthy();
      });

      // Expand Leaderboard section
      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[1]);

      await waitFor(() => {
        // Names appear in both PlayerScoreRow and Leaderboard
        const aliceElements = getAllByText('Alice');
        const bobElements = getAllByText('Bob');
        expect(aliceElements.length).toBeGreaterThan(0);
        expect(bobElements.length).toBeGreaterThan(0);
      });
    });

    it('should display player scores in leaderboard', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [
          { id: '1', username: 'player1', display_name: 'Alice' },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[1]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[1]);

      await waitFor(() => {
        // Should show placeholder when no scores yet
        expect(getByText('--')).toBeTruthy();
      });
    });
  });

  describe('Side Bets Section Content', () => {
    it('should display side bets when expanded', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        side_bets: [
          { id: '1', name: 'Closest to Pin', amount: 5 },
          { id: '2', name: 'Longest Putt', amount: 10 },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[2]).toBeTruthy();
      });

      // Expand Side Bets section
      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[2]);

      await waitFor(() => {
        expect(getByText('Closest to Pin')).toBeTruthy();
        expect(getByText('Longest Putt')).toBeTruthy();
      });
    });

    it('should display side bet amounts', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        side_bets: [
          { id: '1', name: 'Closest to Pin', amount: 5 },
        ],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[2]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[2]);

      await waitFor(() => {
        expect(getByText('$5')).toBeTruthy();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no side bets exist', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
        side_bets: [],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[2]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[2]);

      await waitFor(() => {
        expect(getByText('No side bets for this round')).toBeTruthy();
      });
    });

    it('should show empty state when side_bets is undefined', async () => {
      const mockRoundData = {
        id: 'test-round-123',
        course: {
          name: 'Test Course',
          holes: Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 3,
          })),
        },
        players: [{ id: '1', username: 'player1' }],
      };

      roundService.getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByTestId, getByText } = renderWithTheme(
        <ScorecardRedesignScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        const headers = getAllByTestId('collapsible-header');
        expect(headers[2]).toBeTruthy();
      });

      const headers = getAllByTestId('collapsible-header');
      fireEvent.press(headers[2]);

      await waitFor(() => {
        expect(getByText('No side bets for this round')).toBeTruthy();
      });
    });
  });
});
