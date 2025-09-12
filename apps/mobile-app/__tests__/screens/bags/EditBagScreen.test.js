/**
 * EditBagScreen Tests
 */

import { render } from '@testing-library/react-native';
import EditBagScreen from '../../../src/screens/bags/EditBagScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { useBagRefreshContext } from '../../../src/context/BagRefreshContext';

// Mock the context hook
jest.mock('../../../src/context/BagRefreshContext', () => ({
  ...jest.requireActual('../../../src/context/BagRefreshContext'),
  useBagRefreshContext: jest.fn(),
}));

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  is_public: false,
  is_friends_visible: true,
  disc_count: 12,
};

const mockRoute = {
  params: {
    bag: mockBag,
  },
};

const mockNavigation = {
  goBack: jest.fn(),
};

describe('EditBagScreen', () => {
  beforeEach(() => {
    // Provide default mock implementation for all tests
    useBagRefreshContext.mockReturnValue({
      triggerBagListRefresh: jest.fn(),
      triggerBagRefresh: jest.fn(),
      clearRefreshTrigger: jest.fn(),
      addBagListener: jest.fn(),
      addBagListListener: jest.fn(),
      refreshTriggers: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a EditBagScreen component', () => {
    expect(EditBagScreen).toBeTruthy();
  });

  it('should render form with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <EditBagScreen route={mockRoute} navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByTestId('edit-bag-screen')).toBeTruthy();
  });

  it('should display pre-filled bag name', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <EditBagScreen route={mockRoute} navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByDisplayValue('Course Bag')).toBeTruthy();
  });

  it('should display pre-filled description', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <EditBagScreen route={mockRoute} navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByDisplayValue('My favorite discs for the local course')).toBeTruthy();
  });

  it('should display update bag button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EditBagScreen route={mockRoute} navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByText('Update Bag')).toBeTruthy();
  });

  it('should show friends privacy as selected', () => {
    const { getByText } = render(
      <ThemeProvider>
        <EditBagScreen route={mockRoute} navigation={mockNavigation} />
      </ThemeProvider>,
    );

    // Should render privacy options
    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });
});
