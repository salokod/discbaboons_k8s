/**
 * SearchBar Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import SearchBar from '../../../src/design-system/components/SearchBar';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('SearchBar component', () => {
  it('should export a component', () => {
    expect(SearchBar).toBeTruthy();
  });

  it('should render a search input', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SearchBar />
      </ThemeProvider>,
    );

    expect(getByTestId('search-bar')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
  });

  it('should display search placeholder by default', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <SearchBar />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });

  it('should accept custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <SearchBar placeholder="Search discs..." />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Search discs...')).toBeTruthy();
  });

  it('should call onChangeText when text is entered', () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <SearchBar onChangeText={onChangeTextMock} />
      </ThemeProvider>,
    );

    fireEvent.changeText(getByTestId('search-input'), 'Thunderbird');
    expect(onChangeTextMock).toHaveBeenCalledWith('Thunderbird');
  });

  it('should show clear button when value is present', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SearchBar value="test" />
      </ThemeProvider>,
    );

    // Clear button should be visible when there's a value
    expect(getByTestId('search-clear-button')).toBeTruthy();

    // Re-render without value
    const { queryByTestId: queryByTestIdEmpty } = render(
      <ThemeProvider>
        <SearchBar value="" />
      </ThemeProvider>,
    );

    // Clear button should not be visible when empty
    expect(queryByTestIdEmpty('search-clear-button')).toBeNull();
  });

  it('should call onClear when clear button is pressed', () => {
    const onClearMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <SearchBar value="test" onClear={onClearMock} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('search-clear-button'));
    expect(onClearMock).toHaveBeenCalledTimes(1);
  });
});
