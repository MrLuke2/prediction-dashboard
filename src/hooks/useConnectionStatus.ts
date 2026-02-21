import { useState, useEffect, useRef } from 'react';
import { useNotificationStore } from '../store';

/**
 * Hook to monitor the window online/offline status.
 */
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const { addToast, dismissToast } = useNotificationStore();
  const offlineToastId = useRef<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineToastId.current) {
        dismissToast(offlineToastId.current);
        offlineToastId.current = null;
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      if (!offlineToastId.current) {
        offlineToastId.current = addToast({
          type: 'error',
          title: 'Connection Lost',
          message: 'Retrying tactical link...',
          duration: Infinity
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};
