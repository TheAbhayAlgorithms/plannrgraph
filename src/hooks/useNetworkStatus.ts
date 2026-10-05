import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        title: 'Back Online',
        message: 'Network connection restored.',
        type: 'success',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        title: 'Offline Mode Active',
        message: 'plannrgraph is fully available offline.',
        type: 'info',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  return { isOnline };
}
