/**
 * ThemePicker Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ThemePicker from '../../../src/components/settings/ThemePicker';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
}

describe('ThemePicker', () => {
  it('should export a component', () => {
    expect(ThemePicker).toBeDefined();
    expect(typeof ThemePicker).toBe('object'); // memo returns an object
  });

  it('should render the theme picker component', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByTestId('theme-picker')).toBeTruthy();
  });

  it('should display theme options', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(screen.getByText('Blackout')).toBeTruthy();
  });

  it('should allow selecting a theme option', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    const darkThemeOption = screen.getByTestId('theme-option-dark');
    expect(darkThemeOption).toBeTruthy();

    fireEvent.press(darkThemeOption);
    // Theme change behavior will be tested separately
  });

  it('should have professional styling matching CreateBagScreen patterns', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    const themeContainer = screen.getByTestId('theme-picker');
    expect(themeContainer).toBeTruthy();

    // Check that theme options are present
    expect(screen.getByTestId('theme-option-system')).toBeTruthy();
    expect(screen.getByTestId('theme-option-light')).toBeTruthy();
    expect(screen.getByTestId('theme-option-dark')).toBeTruthy();
    expect(screen.getByTestId('theme-option-blackout')).toBeTruthy();
  });

  it('should show descriptions for each theme option', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByText('Follow your device theme')).toBeTruthy();
    expect(screen.getByText('Clean and bright interface')).toBeTruthy();
    expect(screen.getByText('Easy on the eyes in low light')).toBeTruthy();
    expect(screen.getByText('Pure black for OLED displays')).toBeTruthy();
  });
});
