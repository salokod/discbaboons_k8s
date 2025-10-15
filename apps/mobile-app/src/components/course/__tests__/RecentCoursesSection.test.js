import { render, fireEvent } from '@testing-library/react-native';
import RecentCoursesSection from '../RecentCoursesSection';
import { useThemeColors } from '../../../context/ThemeContext';
import { useRecentCoursesLayout } from '../../../hooks/useRecentCoursesLayout';

// Mock dependencies
jest.mock('../../../context/ThemeContext');
jest.mock('../../../hooks/useRecentCoursesLayout');
jest.mock('../RecentCourseCard', () => {
  const { View, Text } = require('react-native');
  return function MockRecentCourseCard({ course, onPress }) {
    return (
      <View testID={`course-card-${course.id}`} onPress={() => onPress(course)}>
        <Text>{course.name}</Text>
      </View>
    );
  };
});
jest.mock('../SkeletonCourseCard', () => {
  const { View } = require('react-native');
  return function MockSkeletonCourseCard() {
    return <View testID="skeleton-card" />;
  };
});

describe('RecentCoursesSection', () => {
  const mockColors = {
    background: '#FFFFFF',
    border: '#E0E0E0',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
  };

  const mockLayout = {
    horizontalPadding: 16,
    cardWidth: 120,
    gap: 12,
  };

  const mockCourses = [
    {
      id: 'course-1',
      name: 'Blue Lake Park',
      location: 'Portland, OR',
      last_played_at: '2025-10-11T10:00:00Z',
    },
    {
      id: 'course-2',
      name: 'Pier Park',
      location: 'Portland, OR',
      last_played_at: '2025-10-10T10:00:00Z',
    },
  ];

  const mockOnSelectCourse = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useThemeColors.mockReturnValue(mockColors);
    useRecentCoursesLayout.mockReturnValue(mockLayout);
  });

  it('should render section header', () => {
    const { getByText } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    expect(getByText('Recent Courses')).toBeTruthy();
  });

  it('should render horizontal ScrollView', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    const scrollView = getByTestId('recent-courses-scroll');
    expect(scrollView).toBeTruthy();
    expect(scrollView.props.horizontal).toBe(true);
  });

  it('should render course cards', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    expect(getByTestId('course-card-course-1')).toBeTruthy();
    expect(getByTestId('course-card-course-2')).toBeTruthy();
  });

  it('should call onSelectCourse when card pressed', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    const card = getByTestId('course-card-course-1');
    fireEvent(card, 'onPress');

    expect(mockOnSelectCourse).toHaveBeenCalledWith(mockCourses[0]);
  });

  it('should render skeleton cards when loading', () => {
    const { getByTestId, queryByTestId } = render(
      <RecentCoursesSection
        courses={[]}
        onSelectCourse={mockOnSelectCourse}
        loading
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    expect(getByTestId('recent-courses-loading')).toBeTruthy();
    expect(queryByTestId('recent-courses-scroll')).toBeNull();
  });

  it('should render error state with retry button', () => {
    const { getByTestId, getByText } = render(
      <RecentCoursesSection
        courses={[]}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error="Network error"
        onRetry={mockOnRetry}
      />,
    );

    expect(getByTestId('recent-courses-error')).toBeTruthy();
    expect(getByText('Unable to load recent courses')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
  });

  it('should call onRetry when retry pressed', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={[]}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error="Network error"
        onRetry={mockOnRetry}
      />,
    );

    const retryButton = getByTestId('recent-courses-retry');
    fireEvent.press(retryButton);

    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('should return null if courses is empty', () => {
    const { queryByText } = render(
      <RecentCoursesSection
        courses={[]}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    expect(queryByText('Recent Courses')).toBeNull();
  });

  it('should use responsive layout', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    expect(useRecentCoursesLayout).toHaveBeenCalled();
    expect(getByTestId('recent-courses-scroll')).toBeTruthy();
  });

  it('should have correct ScrollView configuration', () => {
    const { getByTestId } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    const scrollView = getByTestId('recent-courses-scroll');
    expect(scrollView.props.horizontal).toBe(true);
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
    expect(scrollView.props.decelerationRate).toBe('fast');
  });

  it('should have correct accessibility properties', () => {
    const { getByText } = render(
      <RecentCoursesSection
        courses={mockCourses}
        onSelectCourse={mockOnSelectCourse}
        loading={false}
        error={null}
        onRetry={mockOnRetry}
      />,
    );

    const header = getByText('Recent Courses');
    expect(header.props.accessibilityRole).toBe('header');
  });
});
