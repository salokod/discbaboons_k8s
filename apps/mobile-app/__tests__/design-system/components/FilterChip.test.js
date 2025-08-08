/**
 * FilterChip Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import FilterChip from '../../../src/design-system/components/FilterChip';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('FilterChip component', () => {
  it('should export a component', () => {
    expect(FilterChip).toBeTruthy();
  });

  it('should render a touchable chip', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <FilterChip label="Test" />
      </ThemeProvider>,
    );

    expect(getByTestId('filter-chip')).toBeTruthy();
  });

  it('should display label text', () => {
    const { getByText } = render(
      <ThemeProvider>
        <FilterChip label="Speed: 9-12" />
      </ThemeProvider>,
    );

    expect(getByText('Speed: 9-12')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <FilterChip label="Test" onPress={onPressMock} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('filter-chip'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should have different styling when selected', () => {
    const { getByTestId: getByTestIdSelected } = render(
      <ThemeProvider>
        <FilterChip label="Test" selected />
      </ThemeProvider>,
    );

    const { getByTestId: getByTestIdUnselected } = render(
      <ThemeProvider>
        <FilterChip label="Test" selected={false} />
      </ThemeProvider>,
    );

    const selectedChip = getByTestIdSelected('filter-chip');
    const unselectedChip = getByTestIdUnselected('filter-chip');

    // Selected and unselected chips should have different background colors
    expect(selectedChip.props.style.backgroundColor).not.toBe(
      unselectedChip.props.style.backgroundColor,
    );
  });
});
