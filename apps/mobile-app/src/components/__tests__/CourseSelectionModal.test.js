import {
  render, screen, fireEvent, waitFor, act,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import CourseSelectionModal from '../CourseSelectionModal';
import { searchCourses } from '../../services/courseService';

// Mock courseService
jest.mock('../../services/courseService');
const mockSearchCourses = searchCourses;

describe('CourseSelectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectCourse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchCourses.mockResolvedValue({
      courses: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });
  });

  it('should render modal with search input when visible', () => {
    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    expect(screen.getByPlaceholderText('Search courses...')).toBeTruthy();
  });

  it('should load courses from API on mount when visible', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Morley Field',
        location: 'San Diego, CA',
        holes: 27,
      },
      {
        id: 'course-2',
        name: 'Kit Carson Park',
        location: 'Escondido, CA',
        holes: 18,
      },
    ];

    mockSearchCourses.mockResolvedValue({
      courses: mockCourses,
      pagination: {
        total: 2, limit: 20, offset: 0, hasMore: false,
      },
    });

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(mockSearchCourses).toHaveBeenCalledWith({ limit: 50 });
    });

    await waitFor(() => {
      expect(screen.getByText('Morley Field')).toBeTruthy();
      expect(screen.getByText('Kit Carson Park')).toBeTruthy();
    });
  });

  it('should show loading state while fetching courses', async () => {
    let resolveSearch;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });
    mockSearchCourses.mockReturnValue(searchPromise);

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    // Step 1: Verify loading state is displayed
    await waitFor(() => {
      expect(screen.getByText('Loading courses...')).toBeTruthy();
    });

    // Step 2: Resolve the promise within act to ensure proper React batching
    await act(async () => {
      resolveSearch({
        courses: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });
    });

    // Step 3: Wait for BOTH conditions - loading gone AND empty state shown
    await waitFor(() => {
      expect(screen.queryByText('Loading courses...')).toBeNull();
      expect(screen.getByText('No courses found')).toBeTruthy();
    }, {
      timeout: 3000, // Explicit timeout for CI environments
    });
  });

  it('should show error state when API fails', async () => {
    const error = new Error('Failed to load courses');
    mockSearchCourses.mockRejectedValue(error);

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading courses')).toBeTruthy();
    });
  });

  it('should show empty state when no courses found', async () => {
    mockSearchCourses.mockResolvedValue({
      courses: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No courses found')).toBeTruthy();
    });
  });

  it('should filter courses based on search query', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Morley Field',
        location: 'San Diego, CA',
        holes: 27,
      },
      {
        id: 'course-2',
        name: 'Kit Carson Park',
        location: 'Escondido, CA',
        holes: 18,
      },
    ];

    mockSearchCourses.mockResolvedValue({
      courses: mockCourses,
      pagination: {
        total: 2, limit: 20, offset: 0, hasMore: false,
      },
    });

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Morley Field')).toBeTruthy();
    });

    // Search for "Kit"
    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.changeText(searchInput, 'Kit');

    await waitFor(() => {
      expect(mockSearchCourses).toHaveBeenCalledWith({
        q: 'Kit',
        limit: 50,
      });
    });
  });

  it('should call onSelectCourse and onClose when course is selected', async () => {
    const mockCourse = {
      id: 'course-1',
      name: 'Morley Field',
      location: 'San Diego, CA',
      holes: 27,
    };

    mockSearchCourses.mockResolvedValue({
      courses: [mockCourse],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    render(
      <ThemeProvider>
        <CourseSelectionModal
          visible
          onClose={mockOnClose}
          onSelectCourse={mockOnSelectCourse}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Morley Field')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Morley Field'));

    expect(mockOnSelectCourse).toHaveBeenCalledWith(mockCourse);
    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('Slice 6.1: Use SearchBar Component', () => {
    it('should render SearchBar component from design system', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId('search-bar')).toBeTruthy();
      });
    });

    it('should handle search text changes', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Oak Grove');

      await waitFor(() => {
        expect(mockSearchCourses).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'Oak Grove' }),
        );
      });
    });
  });

  describe('Slice 6.2: Visual Search Feedback', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show searching indicator during debounce', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByTestId, queryByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      // Wait for initial load
      await act(async () => {
        jest.runAllTimers();
      });

      // Clear the mock to track new calls
      mockSearchCourses.mockClear();

      // Type in search
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Oak');

      // Should show searching indicator
      expect(queryByTestId('search-feedback-indicator')).toBeTruthy();

      // After debounce completes
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(queryByTestId('search-feedback-indicator')).toBeNull();
      });
    });

    it('should not show indicator when not searching', () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { queryByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      expect(queryByTestId('search-feedback-indicator')).toBeNull();
    });
  });

  describe('Slice 6.3: Result Count Display', () => {
    it('should display result count when courses loaded', async () => {
      const mockCourses = [
        {
          id: '1', name: 'Course 1', city: 'Austin', state: 'TX', holes: 18,
        },
        {
          id: '2', name: 'Course 2', city: 'Austin', state: 'TX', holes: 18,
        },
        {
          id: '3', name: 'Course 3', city: 'Austin', state: 'TX', holes: 18,
        },
      ];

      mockSearchCourses.mockResolvedValue({
        courses: mockCourses,
        total: 150,
        limit: 50,
        offset: 0,
        hasMore: true,
      });

      const { getByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Showing 3 of 150 courses')).toBeTruthy();
      });
    });

    it('should not show count when loading', () => {
      mockSearchCourses.mockReturnValue(new Promise(() => {})); // Never resolves

      const { queryByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      expect(queryByText(/Showing/)).toBeNull();
    });

    it('should not show count when error', async () => {
      mockSearchCourses.mockRejectedValue(new Error('Network error'));

      const { queryByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(queryByText(/Showing/)).toBeNull();
      });
    });

    it('should handle singular "course" for 1 result', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [{
          id: '1', name: 'Course 1', city: 'Austin', state: 'TX', holes: 18,
        }],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Showing 1 of 1 course')).toBeTruthy();
      });
    });
  });

  describe('Slice 6.5: Remove Redundant Button', () => {
    it('should not render modalActions container', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { queryByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(queryByTestId('modal-actions')).toBeNull();
      });
    });

    it('should not render Cancel button', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { queryByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(queryByText('Cancel')).toBeNull();
      });
    });

    it('should still have close button in header', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId('modal-close-button')).toBeTruthy();
      });
    });
  });

  describe('Slice 6.6: Integration Tests', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should integrate all improvements smoothly', async () => {
      const mockCourses = [
        {
          id: '1', name: 'Oak Grove', city: 'Austin', state: 'TX', holes: 18,
        },
        {
          id: '2', name: 'Zilker Park', city: 'Austin', state: 'TX', holes: 18,
        },
      ];

      mockSearchCourses.mockResolvedValue({
        courses: mockCourses,
        total: 150,
        limit: 50,
        offset: 0,
        hasMore: true,
      });

      const onClose = jest.fn();
      const onSelectCourse = jest.fn();

      const {
        getByTestId, getByText, queryByTestId, queryByText,
      } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={onClose} onSelectCourse={onSelectCourse} />
        </ThemeProvider>,
      );

      // Wait for initial load
      await act(async () => {
        jest.runAllTimers();
      });

      // 1. SearchBar component from design system
      await waitFor(() => {
        expect(getByTestId('search-bar')).toBeTruthy();
      });

      // 2. Type to search
      mockSearchCourses.mockClear();
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Oak');

      // 3. Visual feedback during debounce
      expect(queryByTestId('search-feedback-indicator')).toBeTruthy();

      // Advance past debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for results
      await waitFor(() => {
        // 4. Result count displayed
        expect(getByText(/Showing 2 of 150 courses/)).toBeTruthy();
      });

      // 5. No redundant cancel button
      expect(queryByText('Cancel')).toBeNull();
      expect(queryByTestId('modal-actions')).toBeNull();

      // But close button still works
      expect(getByTestId('modal-close-button')).toBeTruthy();

      // 6. Touch targets verified (CourseCard)
      const firstCard = getByTestId('course-card-1');
      const flattenedStyle = StyleSheet.flatten(firstCard.props.style);
      expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(44);

      // Select a course
      fireEvent.press(firstCard);
      expect(onSelectCourse).toHaveBeenCalledWith(mockCourses[0]);
    });

    it('should not break existing error handling', async () => {
      mockSearchCourses.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText(/Error loading courses/i)).toBeTruthy();
      });
    });

    it('should not break existing empty state', async () => {
      mockSearchCourses.mockResolvedValue({
        courses: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <CourseSelectionModal visible onClose={mockOnClose} onSelectCourse={mockOnSelectCourse} />
        </ThemeProvider>,
      );

      // Wait for initial load
      await act(async () => {
        jest.runAllTimers();
      });

      // Type search that returns no results
      mockSearchCourses.mockClear();
      fireEvent.changeText(getByTestId('search-input'), 'XYZ Nonexistent Course');

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(getByText(/No courses found/i)).toBeTruthy();
      });
    });
  });
});
