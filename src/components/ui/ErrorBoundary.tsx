import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-kalshi-red/5 border border-kalshi-red/20 rounded-xl overflow-hidden">
          <AlertCircle className="text-kalshi-red mb-3 animate-pulse" size={32} />
          <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-1">Module Failed</h3>
          <p className="text-[10px] text-zinc-500 text-center max-w-[200px] leading-relaxed">
            {this.state.error?.message || 'Neural link failed to initialize this widget.'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white uppercase font-bold hover:bg-zinc-800 transition-colors"
          >
            Attempt Re-sync
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
