/**
 * Integration Test Utilities
 * Proper async component testing harness for React Native
 */

import { render, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../../src/context/ThemeContext';

/**
 * Renders a component with theme provider and waits for async initialization
 */
export async function renderWithTheme(component, options = {}) {
  const { testStorage = false, ...renderOptions } = options;

  const result = render(
    <ThemeProvider testMode testStorage={testStorage}>
      {component}
    </ThemeProvider>,
    renderOptions,
  );

  // Small delay to allow theme initialization
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  });

  return result;
}

/**
 * Renders a component with navigation container and theme provider
 */
export async function renderWithNavigationAndTheme(component, options = {}) {
  const { testStorage = false, ...renderOptions } = options;

  const result = render(
    <NavigationContainer>
      <ThemeProvider testMode testStorage={testStorage}>
        {component}
      </ThemeProvider>
    </NavigationContainer>,
    renderOptions,
  );

  // Small delay to allow initialization
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  });

  return result;
}

/**
 * Renders component with just navigation container (for navigation-only tests)
 */
export function renderWithNavigation(component, options = {}) {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
    options,
  );
}

/**
 * Waits for async operations to complete
 */
export async function flushPromises() {
  await act(async () => {
    setTimeout(() => {}, 0);
  });
}

/**
 * Mock factory for theme storage operations
 */
export function createThemeStorageMocks() {
  return {
    getStoredTheme: jest.fn(() => Promise.resolve(null)),
    storeTheme: jest.fn(() => Promise.resolve()),
  };
}

/**
 * Mock factory for system theme service
 */
export function createSystemThemeMocks() {
  return {
    getSystemColorScheme: jest.fn(() => 'light'),
    addSystemThemeChangeListener: jest.fn(() => () => {}),
    isSystemThemeSupported: jest.fn(() => true),
  };
}
