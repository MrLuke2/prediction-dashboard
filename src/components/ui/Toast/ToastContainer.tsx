import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '../../../store';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotificationStore();

  const container = (
    <div 
      className="fixed inset-0 z-[1000] pointer-events-none flex flex-col p-4 sm:p-6 sm:items-end space-y-3 overflow-hidden"
      style={{ 
        // macOS style stack effect handled via framer motion layout property
      }}
    >
      <div className="w-full flex flex-col items-center sm:items-end space-y-3 max-w-sm ml-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast 
              key={toast.id} 
              toast={toast} 
              onDismiss={dismissToast} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  // Use document.body directly for portal if in browser
  if (typeof document === 'undefined') return null;

  return createPortal(container, document.body);
};
