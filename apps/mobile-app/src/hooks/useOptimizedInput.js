/**
 * Performance-optimized input hook
 */

import { useState, useCallback, useMemo } from 'react';
import { debounce } from '../utils/performance';

/**
 * Hook for optimized text input handling with debouncing
 */
export const useOptimizedInput = (initialValue = '', debounceMs = 0, validator = null) => {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(validator ? validator(initialValue) : true);

  // Debounced validation if validator is provided
  const debouncedValidate = useMemo(() => {
    if (!validator) return null;
    return debounce((text) => {
      setIsValid(validator(text));
    }, debounceMs);
  }, [validator, debounceMs]);

  const handleChange = useCallback((text) => {
    setValue(text);
    if (debouncedValidate) {
      debouncedValidate(text);
    } else if (validator) {
      setIsValid(validator(text));
    }
  }, [validator, debouncedValidate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setIsValid(validator ? validator(initialValue) : true);
  }, [initialValue, validator]);

  return {
    value,
    isValid,
    onChange: handleChange,
    reset,
  };
};
