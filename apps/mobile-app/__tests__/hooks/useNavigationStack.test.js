import { renderHook, act } from '@testing-library/react-native';
import { NavigationProvider } from '../../src/context/NavigationContext';
import { useNavigationStack } from '../../src/hooks/useNavigationStack';

function createWrapper() {
  return function TestWrapper({ children }) {
    return (
      <NavigationProvider>
        {children}
      </NavigationProvider>
    );
  };
}

describe('useNavigationStack', () => {
  it('should export useNavigationStack hook', () => {
    expect(useNavigationStack).toBeDefined();
    expect(typeof useNavigationStack).toBe('function');
  });

  it('should provide navigation stack operations', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.stack).toBeDefined();
    expect(Array.isArray(result.current.stack)).toBe(true);
    expect(result.current.push).toBeDefined();
    expect(typeof result.current.push).toBe('function');
    expect(result.current.pop).toBeDefined();
    expect(typeof result.current.pop).toBe('function');
    expect(result.current.clear).toBeDefined();
    expect(typeof result.current.clear).toBe('function');
    expect(result.current.canGoBack).toBeDefined();
    expect(typeof result.current.canGoBack).toBe('boolean');
  });

  it('should initially have empty stack and canGoBack false', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    expect(result.current.stack.length).toBe(0);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should handle push operation correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    act(() => {
      result.current.push({ screen: 'BagDetail', params: { bagId: 1 } });
    });

    expect(result.current.stack.length).toBe(1);
    expect(result.current.stack[0].screen).toBe('BagDetail');
    expect(result.current.stack[0].params.bagId).toBe(1);
    expect(result.current.canGoBack).toBe(true);
  });

  it('should handle pop operation correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    // Push first
    act(() => {
      result.current.push({ screen: 'BagDetail', params: { bagId: 1 } });
    });

    expect(result.current.stack.length).toBe(1);
    expect(result.current.canGoBack).toBe(true);

    // Pop
    let poppedItem;
    act(() => {
      poppedItem = result.current.pop();
    });

    expect(poppedItem.screen).toBe('BagDetail');
    expect(result.current.stack.length).toBe(0);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should handle clear operation correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    // Push multiple items
    act(() => {
      result.current.push({ screen: 'Screen1' });
      result.current.push({ screen: 'Screen2' });
      result.current.push({ screen: 'Screen3' });
    });

    expect(result.current.stack.length).toBe(3);
    expect(result.current.canGoBack).toBe(true);

    // Clear
    act(() => {
      result.current.clear();
    });

    expect(result.current.stack.length).toBe(0);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should handle multiple operations in sequence', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    // Multiple pushes
    act(() => {
      result.current.push({ screen: 'Home' });
      result.current.push({ screen: 'BagList' });
      result.current.push({ screen: 'BagDetail', params: { bagId: 1 } });
    });

    expect(result.current.stack.length).toBe(3);
    expect(result.current.stack[2].screen).toBe('BagDetail');

    // Pop one
    act(() => {
      result.current.pop();
    });

    expect(result.current.stack.length).toBe(2);
    expect(result.current.stack[1].screen).toBe('BagList');

    // Push another
    act(() => {
      result.current.push({ screen: 'EditDisc' });
    });

    expect(result.current.stack.length).toBe(3);
    expect(result.current.stack[2].screen).toBe('EditDisc');
  });

  it('should return null when popping from empty stack', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNavigationStack(), { wrapper });

    let poppedItem;
    act(() => {
      poppedItem = result.current.pop();
    });

    expect(poppedItem).toBeNull();
    expect(result.current.stack.length).toBe(0);
    expect(result.current.canGoBack).toBe(false);
  });
});
