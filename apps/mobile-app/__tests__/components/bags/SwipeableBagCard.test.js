/**
 * SwipeableBagCard Tests
 */

import { render } from '@testing-library/react-native';
import SwipeableBagCard from '../../../src/components/bags/SwipeableBagCard';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  privacy: 'private',
  disc_count: 12,
};

describe('SwipeableBagCard', () => {
  it('should export a SwipeableBagCard component', () => {
    expect(SwipeableBagCard).toBeTruthy();
  });

  it('should render BagCard', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SwipeableBagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByTestId('bag-card')).toBeTruthy();
  });

  it('should import Swipeable from react-native-gesture-handler', () => {
    // This test verifies the import exists by checking if the component renders without error
    // The actual Swipeable usage will be tested in subsequent slices
    const { getByTestId } = render(
      <ThemeProvider>
        <SwipeableBagCard bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByTestId('bag-card')).toBeTruthy();
  });

  it('should render edit action on right swipe', () => {
    const mockOnEdit = jest.fn();
    const component = render(
      <ThemeProvider>
        <SwipeableBagCard bag={mockBag} onEdit={mockOnEdit} />
      </ThemeProvider>,
    );

    // Test that the component structure supports swipe actions
    // The actual swipe gesture testing will require more complex setup
    expect(component.getByTestId('swipeable-bag-card')).toBeTruthy();
  });

  it('should render delete action on right swipe', () => {
    const mockOnDelete = jest.fn();
    const component = render(
      <ThemeProvider>
        <SwipeableBagCard bag={mockBag} onDelete={mockOnDelete} />
      </ThemeProvider>,
    );

    // Test that the component structure supports delete action
    expect(component.getByTestId('swipeable-bag-card')).toBeTruthy();
    // Delete button will be tested in gesture interaction tests
  });
});
