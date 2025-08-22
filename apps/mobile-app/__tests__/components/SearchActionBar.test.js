/**
 * SearchActionBar Component Tests
 */

import { render } from '@testing-library/react-native';
import SearchActionBar from '../../src/components/SearchActionBar';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('SearchActionBar', () => {
  it('should render container when visible is true', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SearchActionBar visible onClear={jest.fn()} onAddDisc={jest.fn()} />
      </ThemeProvider>,
    );
    expect(getByTestId('search-action-bar')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <SearchActionBar visible={false} onClear={jest.fn()} onAddDisc={jest.fn()} />
      </ThemeProvider>,
    );
    expect(queryByTestId('search-action-bar')).toBeNull();
  });
});
