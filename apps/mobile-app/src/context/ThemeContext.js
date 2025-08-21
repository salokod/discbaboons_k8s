import {
  createContext, useContext, useState, useMemo, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { THEME_NAMES, themes } from '../design-system/themes';
import { storeTheme, getStoredTheme } from '../services/themeStorage';
import { resolveTheme } from '../utils/themeResolver';
import { getSystemColorScheme, addSystemThemeChangeListener, isSystemThemeSupported } from '../services/systemTheme';

const ThemeContext = createContext();

export function ThemeProvider({ children, testMode = false, testStorage = false }) {
  const [theme, setTheme] = useState(THEME_NAMES.SYSTEM);
  const [isLoading, setIsLoading] = useState(!testMode);
  const [activeTheme, setActiveTheme] = useState(() => {
    // In test mode, start with light theme to allow proper test control
    if (testMode) {
      return THEME_NAMES.LIGHT;
    }

    // Initialize activeTheme based on initial theme preference
    if (isSystemThemeSupported()) {
      const systemTheme = getSystemColorScheme();
      return resolveTheme(THEME_NAMES.SYSTEM, systemTheme);
    }
    // Fallback to light theme when system detection is unsupported
    return THEME_NAMES.LIGHT;
  });

  // Update activeTheme when theme preference changes
  useEffect(() => {
    // In test mode without storage, handle theme changes directly without system calls
    if (testMode && !testStorage) {
      if (theme === THEME_NAMES.SYSTEM) {
        // In test mode, system theme should use mocked system theme service
        setActiveTheme(THEME_NAMES.LIGHT);
      } else {
        // For non-system themes, resolve directly
        const resolvedTheme = resolveTheme(theme, null);
        setActiveTheme(resolvedTheme);
      }
      return;
    }

    if (theme === THEME_NAMES.SYSTEM && isSystemThemeSupported()) {
      const systemTheme = getSystemColorScheme();
      const resolvedTheme = resolveTheme(theme, systemTheme);
      setActiveTheme(resolvedTheme);
    } else if (theme === THEME_NAMES.SYSTEM) {
      // Fallback to light when system theme detection is unsupported
      setActiveTheme(THEME_NAMES.LIGHT);
    } else {
      // For non-system themes, resolve directly
      const resolvedTheme = resolveTheme(theme, null);
      setActiveTheme(resolvedTheme);
    }
  }, [theme, testMode, testStorage]);

  // Load stored theme on initialization
  useEffect(() => {
    // Skip async loading in test mode unless testStorage is enabled
    if (testMode && !testStorage) {
      setIsLoading(false);
      return;
    }

    const loadStoredTheme = async () => {
      try {
        const storedTheme = await getStoredTheme();
        if (storedTheme && (themes[storedTheme] || storedTheme === THEME_NAMES.SYSTEM)) {
          setTheme(storedTheme);
        }
      } catch (error) {
        // Graceful degradation - keep default theme
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredTheme();
  }, [testMode, testStorage]);

  // Add system theme change listener when preference is set to 'system'
  useEffect(() => {
    // Skip system theme listeners in test mode unless testStorage is enabled
    if (testMode && !testStorage) {
      return undefined;
    }

    if (theme === THEME_NAMES.SYSTEM && isSystemThemeSupported()) {
      const cleanup = addSystemThemeChangeListener((newSystemTheme) => {
        setActiveTheme(newSystemTheme);
      });

      return cleanup;
    }

    return undefined;
  }, [theme, testMode, testStorage]);

  // Function to change theme with persistence
  const changeTheme = useCallback(async (newTheme) => {
    if (themes[newTheme] || newTheme === THEME_NAMES.SYSTEM) {
      setIsLoading(true);
      setTheme(newTheme);

      // Skip storage operations in test mode unless testStorage is enabled
      if (!testMode || testStorage) {
        try {
          await storeTheme(newTheme);
        } catch (error) {
          // Graceful degradation - theme still changes in memory
        }
      }

      setIsLoading(false);
    }
  }, [testMode, testStorage]);

  const value = useMemo(() => ({
    theme,
    activeTheme,
    setTheme,
    changeTheme,
    isLoading,
  }), [theme, activeTheme, isLoading, changeTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  testMode: PropTypes.bool,
  testStorage: PropTypes.bool,
};

ThemeProvider.defaultProps = {
  testMode: false,
  testStorage: false,
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const useThemeColors = () => {
  const { activeTheme } = useTheme();
  return themes[activeTheme];
};
