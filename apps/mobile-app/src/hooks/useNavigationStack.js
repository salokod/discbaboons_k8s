import { useMemo } from 'react';
import { useNavigationContext } from '../context/NavigationContext';

export function useNavigationStack() {
  const {
    navigationStack,
    pushNavigation,
    popNavigation,
    clearNavigation,
  } = useNavigationContext();

  const stack = navigationStack;
  const canGoBack = navigationStack.length > 0;

  const push = pushNavigation;
  const pop = popNavigation;
  const clear = clearNavigation;

  return useMemo(() => ({
    stack,
    canGoBack,
    push,
    pop,
    clear,
  }), [stack, canGoBack, push, pop, clear]);
}
