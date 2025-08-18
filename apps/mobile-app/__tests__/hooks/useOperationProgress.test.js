/**
 * useOperationProgress Hook Tests
 * Test-driven development for operation progress state management
 */

import { renderHook, act } from '@testing-library/react-native';
import useOperationProgress from '../../src/hooks/useOperationProgress';

describe('useOperationProgress Hook', () => {
  describe('should export a function', () => {
    it('should be a function', () => {
      expect(typeof useOperationProgress).toBe('function');
    });
  });

  describe('initial state', () => {
    it('should return initial state with correct defaults', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentItem).toBe(null);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.processedItems).toBe(0);
      expect(result.current.failedItems).toBe(0);
      expect(result.current.operationType).toBe(null);
      expect(result.current.status).toBe('idle');
    });
  });

  describe('function availability', () => {
    it('should provide startOperation function', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(typeof result.current.startOperation).toBe('function');
    });

    it('should provide updateProgress function', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(typeof result.current.updateProgress).toBe('function');
    });

    it('should provide handleSuccess function', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(typeof result.current.handleSuccess).toBe('function');
    });

    it('should provide handleError function', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(typeof result.current.handleError).toBe('function');
    });

    it('should provide resetOperation function', () => {
      const { result } = renderHook(() => useOperationProgress());

      expect(typeof result.current.resetOperation).toBe('function');
    });
  });

  describe('startOperation', () => {
    it('should start operation with correct state changes', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 5,
        });
      });

      expect(result.current.isProcessing).toBe(true);
      expect(result.current.operationType).toBe('move');
      expect(result.current.totalItems).toBe(5);
      expect(result.current.processedItems).toBe(0);
      expect(result.current.failedItems).toBe(0);
      expect(result.current.status).toBe('processing');
      expect(result.current.currentItem).toBe(null);
    });

    it('should require operationType and totalItems parameters', () => {
      const { result } = renderHook(() => useOperationProgress());

      // Should handle missing parameters gracefully
      act(() => {
        result.current.startOperation({});
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.status).toBe('idle');
    });
  });

  describe('updateProgress', () => {
    it('should update progress with current item and increment processed count', () => {
      const { result } = renderHook(() => useOperationProgress());

      // First start an operation
      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 3,
        });
      });

      // Update progress
      act(() => {
        result.current.updateProgress({
          currentItem: 'Disc 1',
        });
      });

      expect(result.current.currentItem).toBe('Disc 1');
      expect(result.current.processedItems).toBe(1);
      expect(result.current.isProcessing).toBe(true);
      expect(result.current.status).toBe('processing');
    });

    it('should increment processed count on each update', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'remove',
          totalItems: 3,
        });
      });

      // First update
      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 1' });
      });
      expect(result.current.processedItems).toBe(1);

      // Second update
      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 2' });
      });
      expect(result.current.processedItems).toBe(2);
    });
  });

  describe('handleSuccess', () => {
    it('should mark operation as successful when all items processed', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 2,
        });
      });

      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 1' });
      });

      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 2' });
      });

      act(() => {
        result.current.handleSuccess();
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.status).toBe('success');
      expect(result.current.currentItem).toBe(null);
    });
  });

  describe('handleError', () => {
    it('should handle error and increment failed count', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 3,
        });
      });

      act(() => {
        result.current.handleError({
          currentItem: 'Disc 1',
          error: 'Network error',
        });
      });

      expect(result.current.failedItems).toBe(1);
      expect(result.current.currentItem).toBe('Disc 1');
      expect(result.current.isProcessing).toBe(true);
      expect(result.current.status).toBe('processing');
    });

    it('should mark operation as failed if all items fail', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'remove',
          totalItems: 1,
        });
      });

      act(() => {
        result.current.handleError({
          currentItem: 'Disc 1',
          error: 'Permission denied',
        });
      });

      expect(result.current.failedItems).toBe(1);
      expect(result.current.status).toBe('error');
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('resetOperation', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useOperationProgress());

      // Set up some state
      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 3,
        });
      });

      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 1' });
      });

      // Reset
      act(() => {
        result.current.resetOperation();
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentItem).toBe(null);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.processedItems).toBe(0);
      expect(result.current.failedItems).toBe(0);
      expect(result.current.operationType).toBe(null);
      expect(result.current.status).toBe('idle');
    });
  });

  describe('progress calculations', () => {
    it('should handle mixed success and error scenarios', () => {
      const { result } = renderHook(() => useOperationProgress());

      act(() => {
        result.current.startOperation({
          operationType: 'move',
          totalItems: 3,
        });
      });

      // Success for first item
      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 1' });
      });

      // Error for second item
      act(() => {
        result.current.handleError({
          currentItem: 'Disc 2',
          error: 'Failed to move',
        });
      });

      // Success for third item
      act(() => {
        result.current.updateProgress({ currentItem: 'Disc 3' });
      });

      expect(result.current.processedItems).toBe(2);
      expect(result.current.failedItems).toBe(1);
      expect(result.current.totalItems).toBe(3);

      // Complete the operation
      act(() => {
        result.current.handleSuccess();
      });

      expect(result.current.status).toBe('partial_success');
      expect(result.current.isProcessing).toBe(false);
    });
  });
});
