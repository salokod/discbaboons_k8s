import {
  createContext, useContext, useState, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { THEME_NAMES, themes } from '../design-system/themes';
import { storeTheme, getStoredTheme } from '../services/themeStorage';
import { resolveTheme } from '../utils/themeResolver';
import { getSystemColorScheme, addSystemThemeChangeListener, isSystemThemeSupported } from '../services/systemTheme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEME_NAMES.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState(() => {
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
  }, [theme]);

  // Load stored theme on initialization
  useEffect(() => {
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
  }, []);

  // Add system theme change listener when preference is set to 'system'
  useEffect(() => {
    if (theme === THEME_NAMES.SYSTEM && isSystemThemeSupported()) {
      const cleanup = addSystemThemeChangeListener((newSystemTheme) => {
        setActiveTheme(newSystemTheme);
      });

      return cleanup;
    }

    return undefined;
  }, [theme]);

  // Function to change theme with persistence
  const changeTheme = async (newTheme) => {
    if (themes[newTheme] || newTheme === THEME_NAMES.SYSTEM) {
      setIsLoading(true);
      setTheme(newTheme);
      try {
        await storeTheme(newTheme);
      } catch (error) {
        // Graceful degradation - theme still changes in memory
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value = useMemo(() => ({
    theme,
    activeTheme,
    setTheme,
    changeTheme,
    isLoading,
  }), [theme, activeTheme, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
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
