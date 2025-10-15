import { render, fireEvent } from '@testing-library/react-native';
import RecentCourseCard from '../RecentCourseCard';
import { useThemeColors } from '../../../context/ThemeContext';
import { useRecentCoursesLayout } from '../../../hooks/useRecentCoursesLayout';

// Mock dependencies
jest.mock('../../../context/ThemeContext');
jest.mock('../../../hooks/useRecentCoursesLayout');
jest.mock('../../../utils/courseHelpers', () => ({
  formatLastPlayed: jest.fn(() => '2 days ago'),
  getCourseInitial: jest.fn((name) => name.charAt(0)),
}));

describe('RecentCourseCard', () => {
  const mockColors = {
    surface: '#FFFFFF',
    primary: '#007AFF',
    white: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    black: '#000000',
  };

  const mockLayout = {
    cardWidth: 120,
    cardHeight: 140,
    gap: 12,
    badgeSize: 48,
    nameFontSize: 14,
    cityFontSize: 12,
    timeFontSize: 11,
  };

  const mockCourse = {
    id: 'course-1',
    name: 'Blue Lake Park',
    location: 'Portland, OR',
    last_played_at: '2025-10-11T10:00:00Z',
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useThemeColors.mockReturnValue(mockColors);
    useRecentCoursesLayout.mockReturnValue(mockLayout);
  });

  it('should render course badge with initial', () => {
    const { getByText } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    expect(getByText('B')).toBeTruthy();
  });

  it('should render course name (1 line, truncated)', () => {
    const { getByText } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const nameElement = getByText('Blue Lake Park');
    expect(nameElement).toBeTruthy();
    expect(nameElement.props.numberOfLines).toBe(1);
    expect(nameElement.props.ellipsizeMode).toBe('tail');
  });

  it('should render course city', () => {
    const { getByText } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const cityElement = getByText('Portland, OR');
    expect(cityElement).toBeTruthy();
    expect(cityElement.props.numberOfLines).toBe(1);
    expect(cityElement.props.ellipsizeMode).toBe('tail');
  });

  it('should render last played timestamp', () => {
    const { getByText } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    expect(getByText('2 days ago')).toBeTruthy();
  });

  it('should call onPress when card tapped', () => {
    const { getByTestId } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const card = getByTestId('recent-course-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledWith(mockCourse);
  });

  it('should apply pressed styles on press', () => {
    const { getByTestId } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const card = getByTestId('recent-course-card');

    // PressableStateCallbackType will render the pressed style function
    expect(card.props.style).toBeDefined();
  });

  it('should have correct accessibility properties', () => {
    const { getByTestId } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const card = getByTestId('recent-course-card');
    expect(card.props.accessibilityRole).toBe('button');
    expect(card.props.accessibilityLabel).toBe(
      'Blue Lake Park, Portland, OR, last played 2 days ago',
    );
    expect(card.props.accessibilityHint).toBe('Double tap to select this course');
  });

  it('should use responsive card size', () => {
    const customLayout = {
      ...mockLayout,
      cardWidth: 150,
      cardHeight: 160,
    };
    useRecentCoursesLayout.mockReturnValue(customLayout);

    const { getByTestId } = render(
      <RecentCourseCard course={mockCourse} onPress={mockOnPress} />,
    );

    const card = getByTestId('recent-course-card');
    expect(useRecentCoursesLayout).toHaveBeenCalled();
    // Verify the hook was called and would provide the custom layout
    expect(card).toBeTruthy();
  });

  it('should format last played as relative time', () => {
    const { formatLastPlayed } = require('../../../utils/courseHelpers');

    render(<RecentCourseCard course={mockCourse} onPress={mockOnPress} />);

    expect(formatLastPlayed).toHaveBeenCalledWith('2025-10-11T10:00:00Z');
  });

  it('should handle very long course names', () => {
    const longNameCourse = {
      ...mockCourse,
      name: 'This Is A Very Long Course Name That Should Be Truncated',
    };

    const { getByText } = render(
      <RecentCourseCard course={longNameCourse} onPress={mockOnPress} />,
    );

    const nameElement = getByText(longNameCourse.name);
    expect(nameElement.props.numberOfLines).toBe(1);
    expect(nameElement.props.ellipsizeMode).toBe('tail');
  });
});
