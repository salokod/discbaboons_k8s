import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NavigationProvider, useNavigationContext } from '../../src/context/NavigationContext';

describe('NavigationContext', () => {
  it('should export a NavigationProvider function', () => {
    expect(NavigationProvider).toBeDefined();
    expect(typeof NavigationProvider).toBe('function');
  });

  it('should export a useNavigationContext hook', () => {
    expect(useNavigationContext).toBeDefined();
    expect(typeof useNavigationContext).toBe('function');
  });

  it('should render NavigationProvider as React component', () => {
    expect(() => {
      render(
        <NavigationProvider>
          <Text>Test</Text>
        </NavigationProvider>,
      );
    }).not.toThrow();
  });

  it('should throw error when hook used outside provider', () => {
    function TestComponent() {
      useNavigationContext();
      return <Text>Test</Text>;
    }

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigationContext must be used within NavigationProvider');
  });

  it('should provide navigation stack state', () => {
    let contextValue;
    function TestComponent() {
      contextValue = useNavigationContext();
      return <Text>Test</Text>;
    }

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );

    expect(contextValue).toBeDefined();
    expect(contextValue.navigationStack).toBeDefined();
    expect(Array.isArray(contextValue.navigationStack)).toBe(true);
    expect(contextValue.navigationStack.length).toBe(0);
  });

  it('should provide navigation functions', () => {
    let contextValue;
    function TestComponent() {
      contextValue = useNavigationContext();
      return <Text>Test</Text>;
    }

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );

    expect(contextValue.pushNavigation).toBeDefined();
    expect(typeof contextValue.pushNavigation).toBe('function');
    expect(contextValue.popNavigation).toBeDefined();
    expect(typeof contextValue.popNavigation).toBe('function');
    expect(contextValue.clearNavigation).toBeDefined();
    expect(typeof contextValue.clearNavigation).toBe('function');
  });

  it('should manage navigation stack correctly', () => {
    let contextValue;
    function TestComponent() {
      contextValue = useNavigationContext();
      return <Text>Test</Text>;
    }

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );

    // Test push operation
    act(() => {
      contextValue.pushNavigation({ screen: 'BagDetail', params: { bagId: 1 } });
    });
    expect(contextValue.navigationStack.length).toBe(1);
    expect(contextValue.navigationStack[0].screen).toBe('BagDetail');

    // Test pop operation
    let popped;
    act(() => {
      popped = contextValue.popNavigation();
    });
    expect(popped.screen).toBe('BagDetail');
    expect(contextValue.navigationStack.length).toBe(0);

    // Test clear operation
    act(() => {
      contextValue.pushNavigation({ screen: 'Screen1' });
      contextValue.pushNavigation({ screen: 'Screen2' });
    });
    expect(contextValue.navigationStack.length).toBe(2);
    act(() => {
      contextValue.clearNavigation();
    });
    expect(contextValue.navigationStack.length).toBe(0);
  });
});
