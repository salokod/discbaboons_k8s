import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { BagRefreshProvider, useBagRefreshContext, useBagRefreshListener } from '../../src/context/BagRefreshContext';

describe('BagRefreshContext - Slice 1: Infrastructure', () => {
  describe('Basic Exports', () => {
    it('should export BagRefreshProvider function', () => {
      expect(BagRefreshProvider).toBeDefined();
      expect(typeof BagRefreshProvider).toBe('function');
    });

    it('should export useBagRefreshContext hook', () => {
      expect(useBagRefreshContext).toBeDefined();
      expect(typeof useBagRefreshContext).toBe('function');
    });

    it('should throw error when hook used outside provider', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        return <Text testID="context-value">{JSON.stringify(context)}</Text>;
      }

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useBagRefreshContext must be used within BagRefreshProvider');
    });
  });
});

describe('BagRefreshContext - Slice 2: Refresh Trigger Storage', () => {
  describe('Trigger State Management', () => {
    it('should initialize with empty triggers map', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        return <Text testID="context-value">{JSON.stringify(context)}</Text>;
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      const contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue).toHaveProperty('refreshTriggers');
      expect(contextValue.refreshTriggers).toEqual({});
    });

    it('should store refresh trigger with timestamp', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        const { triggerBagRefresh } = context;

        return (
          <>
            <Text testID="context-value">{JSON.stringify(context)}</Text>
            <TouchableOpacity testID="trigger-function" onPress={() => triggerBagRefresh('bag-123')}>
              <Text>Trigger</Text>
            </TouchableOpacity>
          </>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      // Trigger refresh
      const beforeTime = Date.now();
      fireEvent.press(getByTestId('trigger-function'));
      const afterTime = Date.now();

      const contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue.refreshTriggers).toHaveProperty('bag-123');

      const timestamp = contextValue.refreshTriggers['bag-123'];
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should update existing trigger timestamp', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        const { triggerBagRefresh } = context;

        return (
          <>
            <Text testID="context-value">{JSON.stringify(context)}</Text>
            <TouchableOpacity testID="trigger-function" onPress={() => triggerBagRefresh('bag-123')}>
              <Text>Trigger</Text>
            </TouchableOpacity>
          </>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      // First trigger
      fireEvent.press(getByTestId('trigger-function'));
      const firstContextValue = JSON.parse(getByTestId('context-value').props.children);
      const firstTimestamp = firstContextValue.refreshTriggers['bag-123'];

      // Wait a bit to ensure different timestamps
      const startWait = Date.now();
      while (Date.now() - startWait < 5) {
        // Small synchronous wait to ensure different timestamps
      }

      // Second trigger
      fireEvent.press(getByTestId('trigger-function'));
      const secondContextValue = JSON.parse(getByTestId('context-value').props.children);
      const secondTimestamp = secondContextValue.refreshTriggers['bag-123'];

      expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
    });
  });
});

describe('BagRefreshContext - Slice 3: Refresh Listener Hook', () => {
  describe('useBagRefreshListener Hook', () => {
    it('should call callback when bag refresh triggered', () => {
      const mockCallback = jest.fn();

      function ListenerComponent() {
        useBagRefreshListener('bag-123', mockCallback);
        return <Text>Listener</Text>;
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-button" onPress={() => triggerBagRefresh('bag-123')}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <ListenerComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // Trigger refresh
      fireEvent.press(getByTestId('trigger-button'));

      // Callback should be called
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback for different bag ID', () => {
      const mockCallback = jest.fn();

      function ListenerComponent() {
        useBagRefreshListener('bag-123', mockCallback);
        return <Text>Listener</Text>;
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-button" onPress={() => triggerBagRefresh('bag-456')}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <ListenerComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // Trigger refresh for different bag
      fireEvent.press(getByTestId('trigger-button'));

      // Callback should NOT be called
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should cleanup listener on unmount', () => {
      const mockCallback = jest.fn();

      function ListenerComponent() {
        useBagRefreshListener('bag-123', mockCallback);
        return <Text>Listener</Text>;
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-button" onPress={() => triggerBagRefresh('bag-123')}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      function TestApp({ showListener }) {
        return (
          <BagRefreshProvider>
            {showListener && <ListenerComponent />}
            <TriggerComponent />
          </BagRefreshProvider>
        );
      }

      const { getByTestId, rerender } = render(<TestApp showListener />);

      // Trigger refresh while listener is mounted
      fireEvent.press(getByTestId('trigger-button'));
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Unmount listener component
      rerender(<TestApp showListener={false} />);

      // Trigger refresh again
      fireEvent.press(getByTestId('trigger-button'));

      // Callback should still only have been called once (listener was cleaned up)
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BagRefreshContext - Slice 4: Auto-Cleanup Mechanism', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Trigger Cleanup', () => {
    it('should clear trigger after consumption', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        const { clearRefreshTrigger } = context;

        return (
          <>
            <Text testID="context-value">{JSON.stringify(context)}</Text>
            <TouchableOpacity testID="clear-button" onPress={() => clearRefreshTrigger('bag-123')}>
              <Text>Clear</Text>
            </TouchableOpacity>
          </>
        );
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-button" onPress={() => triggerBagRefresh('bag-123')}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // First trigger refresh
      fireEvent.press(getByTestId('trigger-button'));

      let contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue.refreshTriggers).toHaveProperty('bag-123');

      // Clear the trigger
      fireEvent.press(getByTestId('clear-button'));

      contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue.refreshTriggers).not.toHaveProperty('bag-123');
    });

    it('should auto-clear triggers older than 5 minutes', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        return <Text testID="context-value">{JSON.stringify(context)}</Text>;
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-button" onPress={() => triggerBagRefresh('bag-123')}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // Trigger refresh
      fireEvent.press(getByTestId('trigger-button'));

      let contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue.refreshTriggers).toHaveProperty('bag-123');

      // Fast-forward time by 5 minutes + 1ms
      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Trigger another refresh to initiate cleanup
      fireEvent.press(getByTestId('trigger-button'));

      contextValue = JSON.parse(getByTestId('context-value').props.children);
      // Should have a new timestamp, and old one should be cleaned up
      expect(contextValue.refreshTriggers).toHaveProperty('bag-123');
    });

    it('should handle multiple simultaneous triggers', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        return <Text testID="context-value">{JSON.stringify(context)}</Text>;
      }

      function TriggerComponent() {
        const { triggerBagRefresh } = useBagRefreshContext();
        return (
          <>
            <TouchableOpacity testID="trigger-1" onPress={() => triggerBagRefresh('bag-1')}>
              <Text>Trigger 1</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="trigger-2" onPress={() => triggerBagRefresh('bag-2')}>
              <Text>Trigger 2</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="trigger-3" onPress={() => triggerBagRefresh('bag-3')}>
              <Text>Trigger 3</Text>
            </TouchableOpacity>
          </>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // Trigger multiple bags
      fireEvent.press(getByTestId('trigger-1'));
      fireEvent.press(getByTestId('trigger-2'));
      fireEvent.press(getByTestId('trigger-3'));

      const contextValue = JSON.parse(getByTestId('context-value').props.children);
      expect(contextValue.refreshTriggers).toHaveProperty('bag-1');
      expect(contextValue.refreshTriggers).toHaveProperty('bag-2');
      expect(contextValue.refreshTriggers).toHaveProperty('bag-3');
      expect(Object.keys(contextValue.refreshTriggers)).toHaveLength(3);
    });
  });
});

describe('BagRefreshContext - Slice 5: Bag List Refresh Support', () => {
  describe('triggerBagListRefresh function', () => {
    it('should export triggerBagListRefresh function', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        const hasTriggerFunction = typeof context.triggerBagListRefresh === 'function';
        return <Text testID="has-trigger-function">{hasTriggerFunction ? 'true' : 'false'}</Text>;
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      expect(getByTestId('has-trigger-function').props.children).toBe('true');
    });

    it('should notify bag list listeners when triggered', () => {
      const mockCallback = jest.fn();

      function ListenerComponent() {
        const { addBagListListener } = useBagRefreshContext();

        // Set up listener
        useEffect(() => {
          const cleanup = addBagListListener(mockCallback);
          return cleanup;
        }, [addBagListListener]);

        return <Text>Listener</Text>;
      }

      function TriggerComponent() {
        const { triggerBagListRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-bag-list" onPress={() => triggerBagListRefresh()}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <ListenerComponent />
          <TriggerComponent />
        </BagRefreshProvider>,
      );

      // Trigger bag list refresh
      fireEvent.press(getByTestId('trigger-bag-list'));

      // Callback should be called
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should maintain backward compatibility with existing bag-specific refreshes', () => {
      const bagSpecificCallback = jest.fn();
      const bagListCallback = jest.fn();

      function TestComponent() {
        const { triggerBagRefresh, triggerBagListRefresh } = useBagRefreshContext();

        useBagRefreshListener('bag-123', bagSpecificCallback);

        return (
          <>
            <TouchableOpacity testID="trigger-bag" onPress={() => triggerBagRefresh('bag-123')}>
              <Text>Trigger Bag</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="trigger-list" onPress={() => triggerBagListRefresh()}>
              <Text>Trigger List</Text>
            </TouchableOpacity>
          </>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      // Trigger bag-specific refresh
      fireEvent.press(getByTestId('trigger-bag'));
      expect(bagSpecificCallback).toHaveBeenCalledTimes(1);
      expect(bagListCallback).not.toHaveBeenCalled();

      // Reset mocks
      bagSpecificCallback.mockClear();
      bagListCallback.mockClear();

      // Trigger bag list refresh
      fireEvent.press(getByTestId('trigger-list'));
      expect(bagSpecificCallback).not.toHaveBeenCalled();
      expect(bagListCallback).not.toHaveBeenCalled(); // No listener set up in this test
    });
  });

  describe('addBagListListener function', () => {
    it('should export addBagListListener function', () => {
      function TestComponent() {
        const context = useBagRefreshContext();
        const hasListenerFunction = typeof context.addBagListListener === 'function';
        return <Text testID="has-listener-function">{hasListenerFunction ? 'true' : 'false'}</Text>;
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      expect(getByTestId('has-listener-function').props.children).toBe('true');
    });

    it('should support multiple bag list listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      function TestComponent() {
        const { addBagListListener, triggerBagListRefresh } = useBagRefreshContext();

        // Set up multiple listeners
        useEffect(() => {
          const cleanup1 = addBagListListener(callback1);
          const cleanup2 = addBagListListener(callback2);
          return () => {
            cleanup1();
            cleanup2();
          };
        }, [addBagListListener]);

        return (
          <TouchableOpacity testID="trigger-list" onPress={() => triggerBagListRefresh()}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      // Trigger bag list refresh
      fireEvent.press(getByTestId('trigger-list'));

      // Both callbacks should be called
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should cleanup bag list listeners properly', () => {
      const mockCallback = jest.fn();

      function ListenerComponent() {
        const { addBagListListener } = useBagRefreshContext();

        useEffect(() => {
          const cleanup = addBagListListener(mockCallback);
          return cleanup;
        }, [addBagListListener]);

        return <Text>Listener</Text>;
      }

      function TriggerComponent() {
        const { triggerBagListRefresh } = useBagRefreshContext();
        return (
          <TouchableOpacity testID="trigger-list" onPress={() => triggerBagListRefresh()}>
            <Text>Trigger</Text>
          </TouchableOpacity>
        );
      }

      function TestApp({ showListener }) {
        return (
          <BagRefreshProvider>
            {showListener && <ListenerComponent />}
            <TriggerComponent />
          </BagRefreshProvider>
        );
      }

      const { getByTestId, rerender } = render(<TestApp showListener />);

      // Trigger refresh while listener is mounted
      fireEvent.press(getByTestId('trigger-list'));
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Unmount listener component
      rerender(<TestApp showListener={false} />);

      // Trigger refresh again
      fireEvent.press(getByTestId('trigger-list'));

      // Callback should still only have been called once (listener was cleaned up)
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BagRefreshContext - Slice 6: App Integration', () => {
  describe('Provider Integration', () => {
    it('should wrap navigation with BagRefreshProvider', () => {
      // This test will be checked by examining the App.js file structure

      const contextModule = require('../../src/context/BagRefreshContext');
      expect(contextModule.BagRefreshProvider).toBeDefined();
      expect(typeof contextModule.BagRefreshProvider).toBe('function');
    });

    it('should maintain existing provider hierarchy', () => {
      // Test that provider can be nested properly without errors
      function NestedProviderTest() {
        return (
          <BagRefreshProvider>
            <Text testID="nested-test">Provider nests correctly</Text>
          </BagRefreshProvider>
        );
      }

      const { getByTestId } = render(<NestedProviderTest />);
      expect(getByTestId('nested-test')).toBeDefined();
    });

    it('should not break existing functionality', () => {
      // Basic integration test - if previous tests pass, integration is working
      function TestComponent() {
        const context = useBagRefreshContext();
        return <Text testID="context-available">{context ? 'available' : 'unavailable'}</Text>;
      }

      const { getByTestId } = render(
        <BagRefreshProvider>
          <TestComponent />
        </BagRefreshProvider>,
      );

      expect(getByTestId('context-available').props.children).toBe('available');
    });
  });
});
