/**
 * BagsListScreen Tests
 */

import { render } from '@testing-library/react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('BagsListScreen', () => {
  it('should export a BagsListScreen component', () => {
    expect(BagsListScreen).toBeTruthy();
  });

  it('should show empty bags screen when no bags exist', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagsListScreen />
      </ThemeProvider>,
    );

    // Should render EmptyBagsScreen when no bags
    expect(getByTestId('empty-bags-screen')).toBeTruthy();
  });

  it('should display empty state content', () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagsListScreen />
      </ThemeProvider>,
    );

    expect(getByText('Organize Your Disc Golf Collection')).toBeTruthy();
    expect(getByText('Create First Bag')).toBeTruthy();
  });
});
