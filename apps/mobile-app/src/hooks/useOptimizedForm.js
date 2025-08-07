/**
 * Performance-optimized form management hook
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for optimized form state management
 */
export const useOptimizedForm = (initialValues = {}, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Memoized validation results
  const validationResults = useMemo(() => {
    const results = {};
    Object.keys(validators).forEach((field) => {
      if (validators[field] && values[field] !== undefined) {
        results[field] = validators[field](values[field]);
      }
    });
    return results;
  }, [values, validators]);

  // Check if form is valid
  const isValid = useMemo(
    () => Object.values(validationResults).every(Boolean),
    [validationResults],
  );

  // Update field value
  const setValue = useCallback((field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  }, [errors]);

  // Mark field as touched
  const setFieldTouched = useCallback((field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  // Validate specific field
  const validateField = useCallback((field) => {
    const validator = validators[field];
    if (validator && values[field] !== undefined) {
      const isValidField = validator(values[field]);
      if (!isValidField) {
        setErrors((prev) => ({
          ...prev,
          [field]: `Invalid ${field}`,
        }));
      }
      return isValidField;
    }
    return true;
  }, [validators, values]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Get field props for easy integration
  const getFieldProps = useCallback((field) => ({
    value: values[field] || '',
    onChangeText: (value) => setValue(field, value),
    onBlur: () => {
      setFieldTouched(field);
      validateField(field);
    },
  }), [values, setValue, setFieldTouched, validateField]);

  return {
    values,
    errors,
    touched,
    isValid,
    validationResults,
    setValue,
    setFieldTouched,
    validateField,
    reset,
    getFieldProps,
  };
};
