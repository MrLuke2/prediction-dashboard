import React, { useEffect, useRef } from 'react';

/**
 * Higher-Order Component to track component render performance in development.
 * Logs a warning if a render takes longer than the frame budget (16ms).
 */
export function measureRender<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  // Tree-shakeable: only active in development
  if (process.env.NODE_ENV === 'production') {
    return Component;
  }

  const WrappedComponent = (props: P) => {
    const renderStartTime = useRef<number>(0);
    
    // Capture start time before rendering
    renderStartTime.current = performance.now();
    
    useEffect(() => {
      const duration = performance.now() - renderStartTime.current;
      
      if (duration > 16) {
        console.warn(
          `%c[Perf] SLOW RENDER: <${componentName} /> took ${duration.toFixed(2)}ms`,
          'color: #ff4444; font-weight: bold;'
        );
      }
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `Measured(${componentName})`;
  return WrappedComponent;
}

/**
 * Placeholder for global performance tracking initialization if needed.
 * Currently, logic is embedded in the measureRender HOC for granular tracking.
 */
export function logSlowRenders() {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[Perf] Slow render logging initialized (>16ms threshold)');
  }
}
