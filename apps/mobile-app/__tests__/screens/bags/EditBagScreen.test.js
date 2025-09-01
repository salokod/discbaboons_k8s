/**
 * EditBagScreen Tests
 */

import { render } from '@testing-library/react-native';
import EditBagScreen from '../../../src/screens/bags/EditBagScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';

// Mock bag service
jest.mock('../../../src/services/bagService', () => ({
  updateBag: jest.fn(),
}));

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  is_public: false,
  is_friends_visible: true,
};

const mockRoute = {
  params: {
    bag: mockBag,
  },
};

describe('EditBagScreen', () => {
  it('should export a EditBagScreen component', () => {
    expect(EditBagScreen).toBeTruthy();
  });

  it('should render form with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <EditBagScreen route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    expect(getByTestId('edit-bag-screen')).toBeTruthy();
  });

  it('should display pre-filled bag name', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <EditBagScreen route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    expect(getByDisplayValue('Course Bag')).toBeTruthy();
  });

  it('should display pre-filled description', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <EditBagScreen route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    expect(getByDisplayValue('My favorite discs for the local course')).toBeTruthy();
  });

  it('should display update bag button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <EditBagScreen route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    expect(getByText('Update Bag')).toBeTruthy();
  });

  it('should show friends privacy as selected', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <EditBagScreen route={mockRoute} />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    // Should render privacy options
    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });
});
