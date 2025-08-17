/**
 * Development-only Performance Monitor Component
 */

import { useEffect, useRef } from 'react';
import { logRender, performanceTimer } from '../utils/performance';

const PerformanceMonitor = ({ children, name, enabled = __DEV__ }) => {
  const renderCount = useRef(0);
  const mountTime = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    mountTime.current = Date.now();
    performanceTimer.start(`${name} mount`);

    return () => {
      performanceTimer.end(`${name} mount`);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(`📊 ${name} unmounted after ${renderCount.current} renders`);
      }
    };
  }, [name, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    renderCount.current += 1;
    logRender(name, { renderCount: renderCount.current });

    return undefined;
  });

  return children;
};

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;
