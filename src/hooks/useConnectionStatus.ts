import { useState, useEffect } from 'react';
import { useNotificationStore } from '../store';

/**
 * Hook to monitor the window online/offline status.
 */
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const { addToast, dismissToast } = useNotificationStore();
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      if (!toastId) {
        const id = addToast({ 
          type: 'error', 
          title: 'Connection Lost', 
          message: 'Real-time data stream paused.',
          duration: Infinity 
        });
        setToastId(id);
      }
    } else {
      if (toastId) {
        dismissToast(toastId);
        setToastId(null);
      }
    }
  }, [isOnline, toastId, addToast, dismissToast]);

  return { isOnline };
};
