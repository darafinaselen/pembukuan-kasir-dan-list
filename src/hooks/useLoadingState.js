import { useState, useCallback, useRef } from "react";

/**
 * Custom hook for managing loading states with error handling
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback for successful operations
 * @param {Function} options.onError - Callback for error handling
 * @returns {Object} Loading state management functions and state
 */
export function useLoadingState({
  onSuccess,
  onError,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const startLoading = useCallback(() => {
    // Cancel any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback((result) => {
    stopLoading();
    setError(null);
    if (onSuccess) {
      onSuccess(result);
    }
  }, [stopLoading, onSuccess]);

  const handleError = useCallback((err) => {
    stopLoading();
    const errorMessage = err.message || "Terjadi kesalahan";
    setError(errorMessage);
    if (onError) {
      onError(err);
    }
  }, [stopLoading, onError]);

  const executeAsync = useCallback(async (asyncFn) => {
    startLoading();
    try {
      const result = await asyncFn();
      handleSuccess(result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleError(err);
      }
      throw err;
    }
  }, [startLoading, handleSuccess, handleError]);

  const reset = useCallback(() => {
    stopLoading();
    setError(null);
  }, [stopLoading]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    handleSuccess,
    handleError,
    executeAsync,
    reset,
    abortController: abortControllerRef.current,
  };
}

/**
 * Hook for managing multiple loading states
 * @param {string[]} keys - Array of loading state keys
 * @returns {Object} Loading state management for multiple operations
 */
export function useMultipleLoadingStates(keys = []) {
  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const [errors, setErrors] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );

  const setLoading = useCallback((key, loading) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
    if (loading) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const executeAsync = useCallback(async (key, asyncFn) => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      setLoading(key, false);
      return result;
    } catch (err) {
      setError(key, err.message || "Terjadi kesalahan");
      throw err;
    }
  }, [setLoading, setError]);

  const reset = useCallback((key) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
    setErrors(prev => ({ ...prev, [key]: null }));
  }, []);

  const resetAll = useCallback(() => {
    setLoadingStates(
      keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
    setErrors(
      keys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
    );
  }, [keys]);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    executeAsync,
    reset,
    resetAll,
    isAnyLoading: Object.values(loadingStates).some(Boolean),
  };
}