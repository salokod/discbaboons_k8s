/**
 * useOperationProgress Hook
 * Manages operation progress state for bulk operations with progress tracking
 * Following established hook patterns from the codebase
 */

import { useState, useCallback } from 'react';

function useOperationProgress() {
  // Core progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);
  const [failedItems, setFailedItems] = useState(0);
  const [operationType, setOperationType] = useState(null);
  const [status, setStatus] = useState('idle');

  // Start operation with validation
  const startOperation = useCallback(({ operationType: type, totalItems: total }) => {
    // Validate required parameters
    if (!type || !total || total <= 0) {
      return;
    }

    setIsProcessing(true);
    setOperationType(type);
    setTotalItems(total);
    setProcessedItems(0);
    setFailedItems(0);
    setCurrentItem(null);
    setStatus('processing');
  }, []);

  // Update progress for successful item processing
  const updateProgress = useCallback(({ currentItem: item }) => {
    setCurrentItem(item);
    setProcessedItems((prev) => prev + 1);
  }, []);

  // Handle successful completion
  const handleSuccess = useCallback(() => {
    setIsProcessing(false);
    setCurrentItem(null);

    // Determine final status based on failed items
    if (failedItems > 0) {
      setStatus('partial_success');
    } else {
      setStatus('success');
    }
  }, [failedItems]);

  // Handle error for specific item
  const handleError = useCallback(({ currentItem: item }) => {
    setCurrentItem(item);
    setFailedItems((prev) => prev + 1);

    // Check if this was the last item and all failed
    const newFailedCount = failedItems + 1;
    const totalProcessed = processedItems + newFailedCount;

    if (totalProcessed >= totalItems && newFailedCount === totalItems) {
      setStatus('error');
      setIsProcessing(false);
    }
  }, [failedItems, processedItems, totalItems]);

  // Reset all state to initial values
  const resetOperation = useCallback(() => {
    setIsProcessing(false);
    setCurrentItem(null);
    setTotalItems(0);
    setProcessedItems(0);
    setFailedItems(0);
    setOperationType(null);
    setStatus('idle');
  }, []);

  return {
    isProcessing,
    currentItem,
    totalItems,
    processedItems,
    failedItems,
    operationType,
    status,
    startOperation,
    updateProgress,
    handleSuccess,
    handleError,
    resetOperation,
  };
}

export default useOperationProgress;
