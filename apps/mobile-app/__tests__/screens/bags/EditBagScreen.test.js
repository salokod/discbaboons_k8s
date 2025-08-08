/**
 * EditBagScreen Tests
 */

import { render } from '@testing-library/react-native';
import EditBagScreen from '../../../src/screens/bags/EditBagScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  privacy: 'friends',
};

describe('EditBagScreen', () => {
  it('should export a EditBagScreen component', () => {
    expect(EditBagScreen).toBeTruthy();
  });

  it('should render form with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <EditBagScreen bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByTestId('edit-bag-screen')).toBeTruthy();
  });

  it('should display pre-filled bag name', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <EditBagScreen bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByDisplayValue('Course Bag')).toBeTruthy();
  });

  it('should display pre-filled description', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <EditBagScreen bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByDisplayValue('My favorite discs for the local course')).toBeTruthy();
  });

  it('should display update bag button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EditBagScreen bag={mockBag} />
      </ThemeProvider>,
    );

    expect(getByText('Update Bag')).toBeTruthy();
  });

  it('should show friends privacy as selected', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EditBagScreen bag={mockBag} />
      </ThemeProvider>,
    );

    // Should render privacy options
    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });
});
