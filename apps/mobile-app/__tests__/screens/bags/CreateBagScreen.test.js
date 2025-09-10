/**
 * CreateBagScreen Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateBagScreen from '../../../src/screens/bags/CreateBagScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { useBagRefreshContext } from '../../../src/context/BagRefreshContext';
import * as bagService from '../../../src/services/bagService';

// Mock the context hook
jest.mock('../../../src/context/BagRefreshContext', () => ({
  ...jest.requireActual('../../../src/context/BagRefreshContext'),
  useBagRefreshContext: jest.fn(),
}));

describe('CreateBagScreen', () => {
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

  it('should export a CreateBagScreen component', () => {
    expect(CreateBagScreen).toBeTruthy();
  });

  it('should render form with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <CreateBagScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('create-bag-screen')).toBeTruthy();
  });

  it('should display bag name input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <CreateBagScreen />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Enter a name for your bag')).toBeTruthy();
  });

  it('should display bag description input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <CreateBagScreen />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('e.g., My go-to discs for wooded courses')).toBeTruthy();
  });

  it('should display privacy selection chips', () => {
    const { getByText } = render(
      <ThemeProvider>
        <CreateBagScreen />
      </ThemeProvider>,
    );

    expect(getByText('Private')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Public')).toBeTruthy();
  });

  it('should display create bag button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <CreateBagScreen />
      </ThemeProvider>,
    );

    expect(getByText('Create Bag')).toBeTruthy();
  });

  it('should trigger bag list refresh after successful bag creation', async () => {
    // Mock the bag service
    const mockCreatedBag = { id: '123', name: 'Test Bag' };
    jest.spyOn(bagService, 'createBag').mockResolvedValue(mockCreatedBag);

    // Mock navigation
    const mockNavigation = {
      replace: jest.fn(),
    };

    // Create a spy for the triggerBagListRefresh function
    const mockTriggerBagListRefresh = jest.fn();

    // Override the mock for this specific test
    useBagRefreshContext.mockReturnValue({
      triggerBagListRefresh: mockTriggerBagListRefresh,
      triggerBagRefresh: jest.fn(),
      clearRefreshTrigger: jest.fn(),
      addBagListener: jest.fn(),
      addBagListListener: jest.fn(),
      refreshTriggers: {},
    });

    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <CreateBagScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    // Fill in the bag name
    const nameInput = getByPlaceholderText('Enter a name for your bag');
    fireEvent.changeText(nameInput, 'Test Bag');

    // Tap the create button
    const createButton = getByText('Create Bag');
    fireEvent.press(createButton);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(bagService.createBag).toHaveBeenCalledWith({
        name: 'Test Bag',
        description: '',
        privacy: 'private',
      });
    });

    // Verify that triggerBagListRefresh was called
    await waitFor(() => {
      expect(mockTriggerBagListRefresh).toHaveBeenCalled();
    });
  });
});
