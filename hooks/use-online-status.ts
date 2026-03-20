"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to track the online status of the browser.
 * @returns {boolean} `true` if the browser is online, `false` otherwise.
 */
export function useOnlineStatus() {
  // Initialize state with the current online status, or true for SSR
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    // Ensure this effect runs only in the browser
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
