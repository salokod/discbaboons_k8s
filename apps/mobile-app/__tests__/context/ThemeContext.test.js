import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme, useThemeColors } from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';

describe('ThemeContext', () => {
  it('should export ThemeProvider and useTheme', () => {
    expect(ThemeProvider).toBeDefined();
    expect(useTheme).toBeDefined();
  });

  it('should provide default theme (light)', () => {
    function TestComponent() {
      const { theme } = useTheme();
      return <Text testID="theme-name">{theme}</Text>;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.LIGHT);
  });

  it('should allow theme changes', () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme();
      return (
        <>
          <Text testID="theme-name">{theme}</Text>
          <Text testID="set-dark" onPress={() => setTheme(THEME_NAMES.DARK)}>
            Set Dark
          </Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Initially light theme
    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.LIGHT);

    // Change to dark theme
    act(() => {
      getByTestId('set-dark').props.onPress();
    });
    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.DARK);
  });

  it('should provide theme colors via useThemeColors hook', () => {
    function TestComponent() {
      const colors = useThemeColors();
      return (
        <>
          <Text testID="bg-color">{colors.background}</Text>
          <Text testID="text-color">{colors.text}</Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Should return light theme colors by default
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].background);
    expect(getByTestId('text-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].text);
  });

  it('should update colors when theme changes', () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      const colors = useThemeColors();
      return (
        <>
          <Text testID="bg-color">{colors.background}</Text>
          <Text testID="switch-blackout" onPress={() => setTheme(THEME_NAMES.BLACKOUT)}>
            Switch to Blackout
          </Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Initially light theme
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].background);

    // Switch to blackout theme
    act(() => {
      getByTestId('switch-blackout').props.onPress();
    });
    
    // Colors should update to blackout theme
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.BLACKOUT].background);
  });
});
