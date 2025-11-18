import { useState, useCallback } from "react";

export function useRetry(maxRetries = 3, initialDelay = 1000) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (operation, onRetryAttempt) => {
      setIsRetrying(true);
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          setRetryCount(attempt);
          const result = await operation();

          // Success - reset state
          setRetryCount(0);
          setIsRetrying(false);
          return result;
        } catch (error) {
          attempt++;

          if (attempt > maxRetries) {
            // Max retries exceeded
            setIsRetrying(false);
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = initialDelay * Math.pow(2, attempt - 1);

          // Notify about retry attempt
          if (onRetryAttempt) {
            onRetryAttempt(attempt, maxRetries, delay, error);
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },
    [maxRetries, initialDelay]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
}