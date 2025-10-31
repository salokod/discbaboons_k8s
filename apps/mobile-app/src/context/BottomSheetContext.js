import {
  createContext, useContext, useState, useCallback, useMemo,
} from 'react';
import PropTypes from 'prop-types';

const BottomSheetContext = createContext();

export function BottomSheetProvider({ children }) {
  const [sheets, setSheets] = useState({});

  const openSheet = useCallback((sheetName, props = {}) => {
    setSheets((prev) => ({
      ...prev,
      [sheetName]: { open: true, props },
    }));
  }, []);

  const closeSheet = useCallback((sheetName) => {
    setSheets((prev) => ({
      ...prev,
      [sheetName]: null,
    }));
  }, []);

  const value = useMemo(() => ({
    sheets,
    openSheet,
    closeSheet,
  }), [sheets, openSheet, closeSheet]);

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
    </BottomSheetContext.Provider>
  );
}

BottomSheetProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider');
  }
  return context;
}
