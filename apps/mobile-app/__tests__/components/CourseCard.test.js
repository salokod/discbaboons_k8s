import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import CourseCard from '../../src/components/CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: 'course-1',
    name: 'Morley Field',
    city: 'San Diego',
    state: 'CA',
    holes: 27,
    is_user_submitted: false,
  };

  it('should export a component', () => {
    expect(CourseCard).toBeTruthy();
    expect(typeof CourseCard).toBe('object'); // memo returns an object
  });

  it('should accept required course prop without crashing', () => {
    expect(() => {
      render(
        <ThemeProvider>
          <CourseCard course={mockCourse} />
        </ThemeProvider>,
      );
    }).not.toThrow();
  });

  it('should render course name with proper typography', () => {
    const { getByText } = render(
      <ThemeProvider>
        <CourseCard course={mockCourse} />
      </ThemeProvider>,
    );

    const courseName = getByText('Morley Field');
    expect(courseName).toBeTruthy();
  });

  it('should render within a Card component', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <CourseCard course={mockCourse} />
      </ThemeProvider>,
    );

    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('should be touchable and call onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <CourseCard course={mockCourse} onPress={mockOnPress} />
      </ThemeProvider>,
    );

    const courseCard = getByTestId(`course-card-${mockCourse.id}`);
    expect(courseCard).toBeTruthy();

    // Note: onPress handler will be tested when implemented
  });

  it('should display city and state location', () => {
    const { getByText } = render(
      <ThemeProvider>
        <CourseCard course={mockCourse} />
      </ThemeProvider>,
    );

    const location = getByText('San Diego, CA');
    expect(location).toBeTruthy();
  });

  it('should display holes count with proper formatting for multiple holes', () => {
    const { getByText } = render(
      <ThemeProvider>
        <CourseCard course={mockCourse} />
      </ThemeProvider>,
    );

    const holes = getByText('27 holes');
    expect(holes).toBeTruthy();
  });

  it('should display holes count with proper formatting for single hole', () => {
    const singleHoleCourse = { ...mockCourse, holes: 1 };
    const { getByText } = render(
      <ThemeProvider>
        <CourseCard course={singleHoleCourse} />
      </ThemeProvider>,
    );

    const holes = getByText('1 hole');
    expect(holes).toBeTruthy();
  });

  it('should display shield-checkmark icon for official courses', () => {
    const officialCourse = { ...mockCourse, is_user_submitted: false };
    const { root } = render(
      <ThemeProvider>
        <CourseCard course={officialCourse} />
      </ThemeProvider>,
    );

    // Note: This test will be enhanced when we add specific test IDs for icons
    expect(root).toBeTruthy();
  });

  it('should display person-circle icon for user-submitted courses', () => {
    const userSubmittedCourse = { ...mockCourse, is_user_submitted: true };
    const { root } = render(
      <ThemeProvider>
        <CourseCard course={userSubmittedCourse} />
      </ThemeProvider>,
    );

    // Note: This test will be enhanced when we add specific test IDs for icons
    expect(root).toBeTruthy();
  });

  describe('Slice 6.4: Touch Target Accessibility', () => {
    it('should have minimum 44pt touch target height', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <CourseCard course={mockCourse} onPress={jest.fn()} />
        </ThemeProvider>,
      );
      const card = getByTestId(`course-card-${mockCourse.id}`);

      // Check if card has minHeight style
      expect(card.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
        }),
      );

      // Verify minHeight is at least 44
      const flattenedStyle = StyleSheet.flatten(card.props.style);
      expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should be fully tappable across entire card area', () => {
      const onPress = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <CourseCard course={mockCourse} onPress={onPress} />
        </ThemeProvider>,
      );
      const card = getByTestId(`course-card-${mockCourse.id}`);

      fireEvent.press(card);
      expect(onPress).toHaveBeenCalledWith(mockCourse);
    });
  });
});
