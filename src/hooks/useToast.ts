import { useNotificationStore } from '../store';
import { ToastType, Toast } from '../store/types';

export const useToast = () => {
  const addToast = useNotificationStore((state) => state.addToast);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  const createToast = (type: ToastType) => (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
    return addToast({
      type,
      title,
      message,
      ...options,
    });
  };

  return {
    success: createToast('success'),
    error: createToast('error'),
    warning: createToast('warning'),
    info: createToast('info'),
    trade: createToast('trade'),
    agent: createToast('agent'),
    dismiss: dismissToast,
  };
};
