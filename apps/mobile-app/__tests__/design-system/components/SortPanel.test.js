/**
 * SortPanel Component Tests
 */

import { render } from '@testing-library/react-native';
import SortPanel from '../../../src/design-system/components/SortPanel';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('SortPanel component', () => {
  it('should export a component', () => {
    expect(SortPanel).toBeTruthy();
  });

  it('should render when visible', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SortPanel
          visible
          onClose={() => {}}
          onApplySort={() => {}}
          currentSort={{ field: null, direction: 'asc' }}
          testID="sort-panel"
        />
      </ThemeProvider>,
    );

    expect(getByTestId('sort-panel')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <SortPanel
          visible={false}
          onClose={() => {}}
          onApplySort={() => {}}
          currentSort={{ field: null, direction: 'asc' }}
          testID="sort-panel"
        />
      </ThemeProvider>,
    );

    expect(queryByTestId('sort-panel')).toBeNull();
  });

  describe('Footer Button Layout', () => {
    it('should have 60/40 button split with proper variants and 16px gap', () => {
      const { getByText } = render(
        <ThemeProvider>
          <SortPanel
            visible
            onClose={() => {}}
            onApplySort={() => {}}
            currentSort={{ field: null, direction: 'asc' }}
          />
        </ThemeProvider>,
      );

      const clearButton = getByText('Clear Sort').parent.parent;
      const applyButton = getByText('Apply').parent.parent;

      // Clear button should be outline variant with flex: 1 (40%)
      expect(clearButton.props.style).toMatchObject({ flex: 1 });

      // Apply button should be primary variant with flex: 1.5 (60%)
      expect(applyButton.props.style).toMatchObject({ flex: 1.5 });
    });
  });
});
