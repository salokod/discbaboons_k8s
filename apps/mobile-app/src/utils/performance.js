/* eslint-disable no-console */
/**
 * Performance monitoring utilities for development
 */

const isDev = __DEV__;

/**
 * Console performance timer for measuring operations
 */
export const performanceTimer = {
  start: (label) => {
    if (isDev && console.time) {
      console.time(label);
    }
  },
  end: (label) => {
    if (isDev && console.timeEnd) {
      console.timeEnd(label);
    }
  },
};

/**
 * Log component render information in development
 */
export const logRender = (componentName, props = {}) => {
  if (isDev) {
    console.log(`🔄 ${componentName} rendered`, {
      timestamp: new Date().toISOString(),
      propsCount: Object.keys(props).length,
    });
  }
};

/**
 * Measure async operation performance
 */
export const measureAsync = async (label, asyncFn) => {
  const startTime = Date.now();
  try {
    const result = await asyncFn();
    const endTime = Date.now();
    if (isDev) {
      console.log(`⏱️ ${label}: ${endTime - startTime}ms`);
    }
    return result;
  } catch (error) {
    const endTime = Date.now();
    if (isDev) {
      console.error(`❌ ${label} failed after ${endTime - startTime}ms:`, error);
    }
    throw error;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
};
