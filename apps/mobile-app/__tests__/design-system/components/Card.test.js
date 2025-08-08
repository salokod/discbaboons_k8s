/**
 * Card Component Tests
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import Card from '../../../src/design-system/components/Card';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('Card component', () => {
  it('should export a component', () => {
    expect(Card).toBeTruthy();
  });

  it('should render a View', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Card />
      </ThemeProvider>,
    );

    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card>
          <Text>Test content</Text>
        </Card>
      </ThemeProvider>,
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('should apply theme-aware surface color', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Card />
      </ThemeProvider>,
    );

    const card = getByTestId('card');
    expect(card.props.style).toHaveProperty('backgroundColor');
  });
});
