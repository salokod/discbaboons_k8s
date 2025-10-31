import { useState, useEffect } from 'react';
import * as networkService from '../services/networkService';

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial state
    networkService.isConnected().then((connected) => {
      setIsOnline(connected);
    });

    // Listen for changes
    const unsubscribe = networkService.addEventListener((connected) => {
      setIsOnline(connected);
    });

    return () => {
      networkService.removeEventListener(unsubscribe);
    };
  }, []);

  return { isOnline };
}
