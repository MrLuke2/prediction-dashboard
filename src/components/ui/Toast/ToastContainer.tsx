import React from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore } from '../../../store';
import { Toast } from './Toast';
import { cn } from '../../../lib/utils';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export const ToastContainer: React.FC = () => {
    const toasts = useNotificationStore(state => state.toasts);
    const dismissToast = useNotificationStore(state => state.dismissToast);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Render nothing if no toasts
    if (toasts.length === 0) return null;

    const content = (
        <div 
            className={cn(
                "fixed z-[200] flex flex-col gap-3 p-4 pointer-events-none transition-all duration-500",
                isMobile ? "top-0 left-0 right-0 items-center" : "top-4 right-4 items-end"
            )}
            aria-live="polite"
        >
            {toasts.map((toast, index) => (
                <Toast 
                    key={toast.id} 
                    toast={toast} 
                    onClose={dismissToast} 
                    index={index} 
                />
            ))}
        </div>
    );

    // Render via portal to document.body
    return createPortal(content, document.body);
};
