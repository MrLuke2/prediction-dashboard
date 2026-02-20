import { useNotificationStore } from '../store';
import { ToastType, Toast } from '../store/types';

/**
 * Shorthand hook for dispatching toast notifications.
 */
export const useToast = () => {
    const addToast = useNotificationStore(state => state.addToast);
    const dismissToast = useNotificationStore(state => state.dismissToast);

    const toast = (params: Omit<Toast, 'id'>) => addToast(params);

    toast.info = (title: string, message?: string, duration?: number) => 
        addToast({ type: 'info' as ToastType, title, message, duration });

    toast.success = (title: string, message?: string, duration?: number) => 
        addToast({ type: 'success' as ToastType, title, message, duration });

    toast.warning = (title: string, message?: string, duration?: number) => 
        addToast({ type: 'warning' as ToastType, title, message, duration });

    toast.error = (title: string, message?: string, duration?: number) => 
        addToast({ type: 'error' as ToastType, title, message, duration });

    toast.trade = (title: string, message?: string, duration?: number) => 
        addToast({ type: 'trade' as ToastType, title, message, duration });

    toast.agent = (title: string, message?: string, providerId?: string, duration?: number) => 
        addToast({ type: 'agent' as ToastType, title, message, duration, providerId });

    return { toast, dismissToast };
};
