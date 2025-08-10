// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Update debounced value after a delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (e.g., user is still typing)
    // This is how the debounce works
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}