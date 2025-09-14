import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react-native';
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

    // Should show loading state
    expect(screen.getByText('Loading courses...')).toBeTruthy();

    // Resolve the search
    resolveSearch({
      courses: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading courses...')).toBeNull();
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
});
