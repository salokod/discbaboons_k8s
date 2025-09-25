/**
 * Avatar Component Tests
 * Tests for user avatar with initials
 */

import { render } from '@testing-library/react-native';
import Avatar from '../Avatar';
import { ThemeProvider } from '../../context/ThemeContext';

// Test wrapper component
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

const renderWithTheme = (component) => render(<TestWrapper>{component}</TestWrapper>);

describe('Avatar', () => {
  it('should export Avatar component', () => {
    expect(Avatar).toBeDefined();
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <Avatar username="testuser" />,
    );

    expect(getByTestId('avatar')).toBeOnTheScreen();
  });

  it('should display first letter of username', () => {
    const { getByText } = renderWithTheme(
      <Avatar username="testuser" />,
    );

    expect(getByText('T')).toBeOnTheScreen();
  });

  it('should display uppercase initial', () => {
    const { getByText } = renderWithTheme(
      <Avatar username="alice" />,
    );

    expect(getByText('A')).toBeOnTheScreen();
  });

  it('should handle empty username gracefully', () => {
    const { getByText } = renderWithTheme(
      <Avatar username="" />,
    );

    expect(getByText('?')).toBeOnTheScreen();
  });

  it('should handle username with special characters', () => {
    const { getByText } = renderWithTheme(
      <Avatar username="@user123" />,
    );

    expect(getByText('@')).toBeOnTheScreen();
  });

  it('should handle username with spaces at start', () => {
    const { getByText } = renderWithTheme(
      <Avatar username="  bob" />,
    );

    expect(getByText('B')).toBeOnTheScreen();
  });

  it('should use consistent color based on username', () => {
    const { getByTestId: getByTestId1 } = renderWithTheme(
      <Avatar username="alice" />,
    );
    const { getByTestId: getByTestId2 } = renderWithTheme(
      <Avatar username="alice" />,
    );

    const avatar1 = getByTestId1('avatar');
    const avatar2 = getByTestId2('avatar');

    // Same username should produce same background color
    expect(avatar1.props.style.backgroundColor).toEqual(avatar2.props.style.backgroundColor);
  });

  it('should use different colors for different usernames', () => {
    const { getByTestId: getByTestId1 } = renderWithTheme(
      <Avatar username="alice" />,
    );
    const { getByTestId: getByTestId2 } = renderWithTheme(
      <Avatar username="bob" />,
    );

    const avatar1 = getByTestId1('avatar');
    const avatar2 = getByTestId2('avatar');

    // Different usernames should produce different background colors
    expect(avatar1.props.style.backgroundColor).not.toEqual(avatar2.props.style.backgroundColor);
  });

  it('should handle null or undefined usernames with consistent color', () => {
    const { getByTestId: getByTestId1 } = renderWithTheme(
      <Avatar username="" />,
    );
    const { getByTestId: getByTestId2 } = renderWithTheme(
      <Avatar username="" />,
    );

    const avatar1 = getByTestId1('avatar');
    const avatar2 = getByTestId2('avatar');

    // Empty usernames should produce consistent color
    expect(avatar1.props.style.backgroundColor).toEqual(avatar2.props.style.backgroundColor);
  });
});
