import React, { Suspense } from 'react';
import { GlassPanel } from '../ui/GlassPanel/GlassPanel';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { WIDGET_REGISTRY } from './registry';
import { WidgetType, LayoutSlots } from '../../store/types';
import { useUIStore, useLayoutStore } from '../../store';

interface WidgetShellProps {
  widgetType: WidgetType;
  slotKey: keyof LayoutSlots;
}

export const WidgetShell: React.FC<WidgetShellProps> = ({ widgetType, slotKey }) => {
  const { isEditMode } = useUIStore();
  const widgetMetadata = WIDGET_REGISTRY[widgetType];
  const WidgetComponent = widgetMetadata.component;

  return (
    <ErrorBoundary 
        fallback={
            <GlassPanel title={widgetMetadata.defaultTitle} className="h-full border-kalshi-red/30">
                <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-kalshi-red/5">
                    <span className="text-kalshi-red text-[10px] font-bold uppercase tracking-widest">Neural Link Error</span>
                </div>
            </GlassPanel>
        }
    >
      <GlassPanel 
        title={widgetMetadata.defaultTitle} 
        className={`h-full ${widgetType === 'pnlCard' ? 'bg-zinc-900/30' : ''}`}
        noPadding={widgetMetadata.noPadding}
        isEditMode={isEditMode}
      >
        <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8 bg-zinc-950/30">
                <div className="w-12 h-12 rounded-full bg-zinc-900 animate-pulse"></div>
                <div className="w-3/4 h-4 bg-zinc-900 rounded animate-pulse"></div>
            </div>
        }>
          <WidgetComponent />
        </Suspense>
      </GlassPanel>
    </ErrorBoundary>
  );
};
