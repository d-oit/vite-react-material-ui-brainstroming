import { useRef, useEffect, useCallback } from 'react';

/**
 * A custom hook that provides a debounced version of a callback function.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @param dependencies Dependencies that should trigger a reset of the debounce timer
 * @returns A debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList = []
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  
  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Clear the timeout when dependencies change or component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [...dependencies]);
  
  // The debounced function
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
    }, delay);
  }, [delay]);
  
  // Function to cancel the debounced callback
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  return [debouncedCallback, cancel];
}

export default useDebounce;
