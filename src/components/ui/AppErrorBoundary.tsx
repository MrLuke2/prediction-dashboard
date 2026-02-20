import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '../../lib/errorReporting';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AppErrorBoundary] Uncaught error:', error, errorInfo);
    } else {
      reportError(error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight">Terminal Error</h1>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              Alpha Mode Predict encountered an unexpected failure. Your terminal session has been suspended to prevent data corruption.
            </p>

            {this.state.error && (
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 text-left overflow-auto max-h-32 mb-4">
                <code className="text-xs text-red-400/80 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors duration-200 active:scale-[0.98]"
            >
              Reload Terminal
            </button>
            
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
              Alpha Mode Predict // Error Core v1.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
