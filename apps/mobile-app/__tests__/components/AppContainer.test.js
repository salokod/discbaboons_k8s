/**
 * AppContainer Component Tests
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import AppContainer from '../../src/components/AppContainer';

describe('AppContainer component', () => {
  it('should export an AppContainer component', () => {
    const AppContainer = require('../../src/components/AppContainer');

    expect(AppContainer.default).toBeDefined();
    expect(typeof AppContainer.default).toBe('function');
  });

  it('should render a container View', () => {
    const { getByTestId } = render(<AppContainer />);

    expect(getByTestId('app-container')).toBeTruthy();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <AppContainer>
        <Text>Test Content</Text>
      </AppContainer>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });
});