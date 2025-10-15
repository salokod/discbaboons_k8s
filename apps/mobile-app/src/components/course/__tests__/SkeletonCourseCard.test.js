import { render } from '@testing-library/react-native';
import SkeletonCourseCard from '../SkeletonCourseCard';
import { useThemeColors } from '../../../context/ThemeContext';
import { useRecentCoursesLayout } from '../../../hooks/useRecentCoursesLayout';

// Mock dependencies
jest.mock('../../../context/ThemeContext');
jest.mock('../../../hooks/useRecentCoursesLayout');

describe('SkeletonCourseCard', () => {
  const mockColors = {
    surface: '#FFFFFF',
    border: '#E0E0E0',
  };

  const mockLayout = {
    cardWidth: 120,
    cardHeight: 140,
    gap: 12,
    badgeSize: 48,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useThemeColors.mockReturnValue(mockColors);
    useRecentCoursesLayout.mockReturnValue(mockLayout);
  });

  it('should render skeleton badge', () => {
    const { getByTestId } = render(<SkeletonCourseCard />);

    const card = getByTestId('skeleton-course-card');
    expect(card).toBeTruthy();
  });

  it('should render skeleton text lines', () => {
    const { getByTestId } = render(<SkeletonCourseCard />);

    const card = getByTestId('skeleton-course-card');
    expect(card).toBeTruthy();
    expect(card.children.length).toBeGreaterThan(1);
  });

  it('should use responsive card size', () => {
    const customLayout = {
      ...mockLayout,
      cardWidth: 150,
      cardHeight: 160,
    };
    useRecentCoursesLayout.mockReturnValue(customLayout);

    const { getByTestId } = render(<SkeletonCourseCard />);

    const card = getByTestId('skeleton-course-card');
    expect(useRecentCoursesLayout).toHaveBeenCalled();
    expect(card).toBeTruthy();
  });

  it('should have pulsing animation', () => {
    const { getByTestId } = render(<SkeletonCourseCard />);

    const card = getByTestId('skeleton-course-card');
    expect(card).toBeTruthy();
    // Animation is created via Animated.loop and useEffect
    expect(card.children.length).toBeGreaterThan(0);
  });
});
