/**
 * useMultiSelect Hook
 * Manages multi-select state for disc collection bulk operations
 * Following established hook patterns from the codebase
 */

import { useState, useCallback, useMemo } from 'react';

function useMultiSelect() {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFlightPaths, setShowFlightPaths] = useState(false);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const enterMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(true);
  }, []);

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedIds(new Set());
    setShowFlightPaths(false);
  }, []);

  return {
    isMultiSelectMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    enterMultiSelectMode,
    exitMultiSelectMode,
    showFlightPaths,
    setShowFlightPaths,
  };
}

export default useMultiSelect;
