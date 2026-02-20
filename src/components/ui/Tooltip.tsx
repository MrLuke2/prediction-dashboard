import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: ReactNode;
  delayDuration?: number;
}

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipProvider: React.FC<{ children: ReactNode; delayDuration?: number }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{ children: ReactNode; delayDuration?: number }> = ({ children }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-block w-full h-full"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { show });
        }
        return child;
      })}
    </div>
  );
};

export const TooltipTrigger: React.FC<TooltipTriggerProps & { show?: boolean }> = ({ children, asChild, show }) => {
  return <>{children}</>;
};

export const TooltipContent: React.FC<TooltipContentProps & { show?: boolean }> = ({ children, className, side = 'top', show }) => {
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 2 : -2 }}
          className={cn(
            "absolute z-[100] px-3 py-1.5 rounded-lg border border-fin-border bg-black/90 backdrop-blur-md shadow-2xl pointer-events-none whitespace-nowrap",
            sideClasses[side],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
