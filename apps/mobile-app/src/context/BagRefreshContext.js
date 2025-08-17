import {
  createContext, useContext, useMemo, useState, useCallback, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';

const BagRefreshContext = createContext();

export function BagRefreshProvider({ children }) {
  const [refreshTriggers, setRefreshTriggers] = useState({});
  const listenersRef = useRef({});
  const bagListListenersRef = useRef([]);

  const cleanupOldTriggers = useCallback(() => {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    setRefreshTriggers((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((bagId) => {
        if (now - cleaned[bagId] > FIVE_MINUTES) {
          delete cleaned[bagId];
        }
      });
      return cleaned;
    });
  }, []);

  const triggerBagRefresh = useCallback((bagId) => {
    // Clean up old triggers first
    cleanupOldTriggers();

    const timestamp = Date.now();

    setRefreshTriggers((prev) => ({
      ...prev,
      [bagId]: timestamp,
    }));

    // Notify listeners
    if (listenersRef.current[bagId]) {
      listenersRef.current[bagId].forEach((callback) => {
        callback(timestamp);
      });
    }
  }, [cleanupOldTriggers]);

  const clearRefreshTrigger = useCallback((bagId) => {
    setRefreshTriggers((prev) => {
      const updated = { ...prev };
      delete updated[bagId];
      return updated;
    });
  }, []);

  const addBagListener = useCallback((bagId, callback) => {
    if (!listenersRef.current[bagId]) {
      listenersRef.current[bagId] = [];
    }
    listenersRef.current[bagId].push(callback);

    // Return cleanup function
    return () => {
      if (listenersRef.current[bagId]) {
        const index = listenersRef.current[bagId].indexOf(callback);
        if (index > -1) {
          listenersRef.current[bagId].splice(index, 1);
        }
        // Clean up empty arrays
        if (listenersRef.current[bagId].length === 0) {
          delete listenersRef.current[bagId];
        }
      }
    };
  }, []);

  const triggerBagListRefresh = useCallback(() => {
    const timestamp = Date.now();

    // Notify all bag list listeners
    bagListListenersRef.current.forEach((callback) => {
      callback(timestamp);
    });
  }, []);

  const addBagListListener = useCallback((callback) => {
    bagListListenersRef.current.push(callback);

    // Return cleanup function
    return () => {
      const index = bagListListenersRef.current.indexOf(callback);
      if (index > -1) {
        bagListListenersRef.current.splice(index, 1);
      }
    };
  }, []);

  const value = useMemo(() => ({
    refreshTriggers,
    triggerBagRefresh,
    clearRefreshTrigger,
    addBagListener,
    triggerBagListRefresh,
    addBagListListener,
  }), [
    refreshTriggers,
    triggerBagRefresh,
    clearRefreshTrigger,
    addBagListener,
    triggerBagListRefresh,
    addBagListListener,
  ]);

  return (
    <BagRefreshContext.Provider value={value}>
      {children}
    </BagRefreshContext.Provider>
  );
}

BagRefreshProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useBagRefreshContext = () => {
  const context = useContext(BagRefreshContext);
  if (!context) {
    throw new Error('useBagRefreshContext must be used within BagRefreshProvider');
  }
  return context;
};

export const useBagRefreshListener = (bagId, callback) => {
  const { addBagListener } = useBagRefreshContext();

  useEffect(() => {
    const cleanup = addBagListener(bagId, callback);
    return cleanup;
  }, [bagId, callback, addBagListener]);
};
