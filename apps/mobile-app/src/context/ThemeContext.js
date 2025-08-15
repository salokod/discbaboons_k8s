import {
  createContext, useContext, useState, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { THEME_NAMES, themes } from '../design-system/themes';
import { storeTheme, getStoredTheme } from '../services/themeStorage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEME_NAMES.LIGHT);

  // Load stored theme on initialization
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const storedTheme = await getStoredTheme();
        if (storedTheme && themes[storedTheme]) {
          setTheme(storedTheme);
        }
      } catch (error) {
        // Graceful degradation - keep default theme
      }
    };

    loadStoredTheme();
  }, []);

  // Function to change theme with persistence
  const changeTheme = async (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      try {
        await storeTheme(newTheme);
      } catch (error) {
        // Graceful degradation - theme still changes in memory
      }
    }
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    changeTheme,
  }), [theme]);

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
  const { theme } = useTheme();
  return themes[theme];
};
