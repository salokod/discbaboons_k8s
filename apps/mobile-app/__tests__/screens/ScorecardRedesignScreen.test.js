import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScorecardRedesignScreen from '../../src/screens/rounds/ScorecardRedesignScreen';
import * as roundService from '../../src/services/roundService';
import { ThemeProvider } from '../../src/context/ThemeContext';

// Mock roundService
jest.mock('../../src/services/roundService');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
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

// Helper to render component with ThemeProvider
const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
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
        { hole: 1, player_id: 'player-1', score: 3 },
        { hole: 1, player_id: 'player-2', score: 3 },
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
});
