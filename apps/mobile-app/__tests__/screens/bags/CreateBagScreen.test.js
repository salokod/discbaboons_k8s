/**
 * CreateBagScreen Tests
 */

import { render } from '@testing-library/react-native';
import CreateBagScreen from '../../../src/screens/bags/CreateBagScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('CreateBagScreen', () => {
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
});
