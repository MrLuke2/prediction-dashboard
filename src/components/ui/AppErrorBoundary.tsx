import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '../../lib/errorReporting';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

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

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Uncaught error:', error);
    } else {
      reportError(error);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-brand-fin-bg text-white p-6 font-sans">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-kalshi-red/10 blur-[120px] pointer-events-none" />
          
          <div className="max-w-md w-full text-center space-y-8 relative z-10">
            <div className="relative inline-block">
                <div className="w-20 h-20 bg-kalshi-red/20 border-2 border-kalshi-red/40 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <AlertTriangle size={40} className="text-kalshi-red" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-white/10 rounded-full p-2 text-white">
                    <Terminal size={14} />
                </div>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">System Critical</h1>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[320px] mx-auto">
                    The A2UI Protocol has encountered a terminal failure. Neural telemetry synchronization has been suspended.
                </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-5 text-left backdrop-blur-md overflow-hidden group">
                <div className="flex items-center space-x-2 mb-3 border-b border-white/5 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kalshi-red animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Diagnostic Stack</span>
                </div>
                <div className="overflow-auto max-h-32 custom-scrollbar">
                    <code className="text-xs text-kalshi-red/90 font-mono break-all leading-tight">
                    {this.state.error.message}
                    </code>
                    {this.state.error.stack && (
                        <pre className="mt-2 text-[8px] text-zinc-700 font-mono overflow-hidden">
                            {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                        </pre>
                    )}
                </div>
              </div>
            )}

            <div className="space-y-4">
                <button
                onClick={this.handleReload}
                className="w-full py-4 px-8 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center space-x-3"
                >
                <RefreshCw size={16} />
                <span>Re-Initialize Terminal</span>
                </button>
                
                <p className="text-[9px] text-zinc-700 font-mono uppercase tracking-[0.3em] font-bold">
                Alpha Mode Predict // PROTOCOL_ERR_01
                </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
