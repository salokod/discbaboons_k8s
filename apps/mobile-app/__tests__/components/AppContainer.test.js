/**
 * AppContainer Component Tests
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import AppContainer from '../../src/components/AppContainer';

describe('AppContainer component', () => {
  it('should render a container View', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AppContainer />
      </ThemeProvider>,
    );

    expect(getByTestId('app-container')).toBeTruthy();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AppContainer>
          <Text>Test Content</Text>
        </AppContainer>
      </ThemeProvider>,
    );

    expect(getByText('Test Content')).toBeTruthy();
  });
});
