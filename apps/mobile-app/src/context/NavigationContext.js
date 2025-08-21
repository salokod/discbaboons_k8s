import {
  createContext, useContext, useMemo, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [navigationStack, setNavigationStack] = useState([]);

  const pushNavigation = useCallback((navigationEntry) => {
    setNavigationStack((prev) => [...prev, navigationEntry]);
  }, []);

  const popNavigation = useCallback(() => {
    if (navigationStack.length > 0) {
      const poppedEntry = navigationStack[navigationStack.length - 1];
      setNavigationStack((prev) => prev.slice(0, -1));
      return poppedEntry;
    }
    return null;
  }, [navigationStack]);

  const clearNavigation = useCallback(() => {
    setNavigationStack([]);
  }, []);

  const value = useMemo(() => ({
    navigationStack,
    pushNavigation,
    popNavigation,
    clearNavigation,
  }), [navigationStack, pushNavigation, popNavigation, clearNavigation]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

NavigationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};
