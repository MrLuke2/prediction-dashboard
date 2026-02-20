import React, { ReactNode, Component, ErrorInfo } from 'react';
import { Move, AlertTriangle, RefreshCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';

// --- Types ---

export type GlassPanelVariant = 'default' | 'alert' | 'highlight';

export interface GlassPanelProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  variant?: GlassPanelVariant;
  isLoading?: boolean;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSwapSelect?: () => void;
  noPadding?: boolean;
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GlassErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlassPanel Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 h-full min-h-[150px]">
          <AlertTriangle className="text-brand-kalshi-red w-8 h-8 opacity-50" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">Component Error</p>
            <p className="text-[10px] text-zinc-500 max-w-[200px]">An unexpected error occurred in this module.</p>
          </div>
          <button 
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-fin-hover hover:bg-zinc-600 text-white rounded-md text-[10px] font-bold transition-colors"
          >
            <RefreshCcw size={12} />
            RETRY
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Sub-components ---

export const GlassSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-brand-fin-hover/50 rounded-md", className)} />
);

export const GlassPanelHeader = ({ 
  title, 
  subtitle, 
  badge, 
  actions, 
  className 
}: Pick<GlassPanelProps, 'title' | 'subtitle' | 'badge' | 'actions' | 'className'>) => (
  <div className={cn("flex items-center justify-between px-4 py-3 border-b border-brand-fin-border bg-zinc-900/30", className)}>
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        {title && (
          <h3 className="font-sans font-bold text-[10px] md:text-xs tracking-wider uppercase text-brand-text-muted">
            {title}
          </h3>
        )}
        {badge}
      </div>
      {subtitle && (
        <p className="text-[10px] text-zinc-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {actions}
    </div>
  </div>
);

export const GlassPanelBody = ({ 
  children, 
  className, 
  noPadding 
}: { 
  children: ReactNode; 
  className?: string; 
  noPadding?: boolean;
}) => (
  <div className={cn("flex-1 relative z-10 flex flex-col min-h-0", !noPadding && "p-4", className)}>
    {children}
  </div>
);

export const GlassPanelFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("px-4 py-2 border-t border-brand-fin-border bg-black/20 text-[10px]", className)}>
    {children}
  </div>
);

// --- Main Component ---

export const GlassPanel = ({
  children,
  className,
  title,
  subtitle,
  badge,
  actions,
  variant = 'default',
  isLoading = false,
  isEditMode = false,
  noPadding = false,
}: GlassPanelProps) => {
  const variantStyles = {
    default: 'border-brand-fin-border',
    alert: 'border-brand-kalshi-red/50 shadow-lg shadow-brand-kalshi-red/5',
    highlight: 'border-brand-poly-blue/50 shadow-lg shadow-brand-poly-blue/5',
  };

  return (
    <div 
      className={cn(
        "relative bg-brand-fin-card border rounded-xl flex flex-col transition-all duration-300",
        variantStyles[variant],
        isEditMode && "border-dashed border-zinc-600 hover:border-zinc-500",
        className
      )}
    >
      <GlassErrorBoundary onRetry={() => console.log("Retrying panel...")}>
        {/* Header Logic */}
        {(title || subtitle || badge || actions) && (
          <GlassPanelHeader 
            title={title} 
            subtitle={subtitle} 
            badge={badge} 
            actions={actions} 
          />
        )}

        {/* Edit Mode Overlay */}
        {isEditMode && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-[60] flex items-center justify-center transition-all animate-in fade-in duration-300 pointer-events-none">
             <div className="px-4 py-2 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 bg-zinc-900/90 text-zinc-400 border border-white/5 shadow-2xl">
                <Move size={12} className="opacity-40" />
                <span>Drag to Swap</span>
             </div>
          </div>
        )}

        {/* Body logic with Loading State */}
        <GlassPanelBody noPadding={noPadding} className={cn(isLoading && "opacity-50 pointer-events-none")}>
          {isLoading ? (
            <div className="space-y-4">
              <GlassSkeleton className="h-4 w-3/4" />
              <GlassSkeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <GlassSkeleton className="h-8 flex-1" />
                <GlassSkeleton className="h-8 flex-1" />
              </div>
            </div>
          ) : (
            children
          )}
        </GlassPanelBody>
      </GlassErrorBoundary>
    </div>
  );
};

// --- Compound Component Assignment ---
GlassPanel.Header = GlassPanelHeader;
GlassPanel.Body = GlassPanelBody;
GlassPanel.Footer = GlassPanelFooter;
GlassPanel.Skeleton = GlassSkeleton;
GlassPanel.ErrorBoundary = GlassErrorBoundary;
