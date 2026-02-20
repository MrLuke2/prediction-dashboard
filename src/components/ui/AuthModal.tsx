import React, { useState, useEffect, useMemo } from 'react';
import { X, Mail, ShieldCheck, Lock, Loader2, Bot, Zap, Sparkles, Cpu } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useUIStore, useNotificationStore } from '../../store';
import { authApi } from '../../services/api/authApi';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { cn } from '../../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const containerRef = useFocusTrap(isOpen);
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setAuth = useUIStore(state => state.setAuth);
  const aiProvider = useUIStore(state => state.aiProvider);
  const currentProvider = useMemo(() => 
    AI_PROVIDERS.find(p => p.id === aiProvider.providerId) || AI_PROVIDERS[0],
    [aiProvider.providerId]
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  
  const getPasswordStrength = (p: string) => {
    if (p.length === 0) return 0;
    if (p.length < 8) return 1;
    if (p.length < 12) return 2;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) return 4;
    return 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email address');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = activeTab === 'login' 
        ? await authApi.login(email, password)
        : await authApi.register(email, password);
      
      setAuth(response.token, response.user);
      
      // Prompt 6: Login success toast
      useNotificationStore.getState().addToast({
        type: 'success',
        title: 'Access Granted',
        message: `Welcome back — ${currentProvider.name} agents active`
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const providerIcon = (id: string) => {
    switch (id) {
      case 'anthropic': return <Bot size={12} />;
      case 'openai': return <Zap size={12} />;
      case 'gemini': return <Sparkles size={12} />;
      default: return <Cpu size={12} />;
    }
  };

  if (!isOpen) return null;

  const strength = getPasswordStrength(password);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-md bg-fin-card border border-fin-border rounded-2xl shadow-2xl p-0 overflow-hidden relative"
      >
        <div className="h-1 w-full bg-gradient-to-r from-poly-blue via-poly-blue to-kalshi-green"></div>
        
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 brand-focus-ring rounded-md"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-zinc-900 border border-fin-border rounded-xl flex items-center justify-center mb-5 shadow-inner">
              <ShieldCheck size={28} className="text-poly-blue" />
            </div>
            <h2 id="auth-modal-title" className="text-2xl font-bold text-white tracking-tight mb-2">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[260px]">
              Access the Alpha Terminal and high-frequency arbitrage execution engine.
            </p>
          </div>

          <div className="flex bg-zinc-900/50 p-1 rounded-lg mb-6 border border-fin-border/50">
            <button 
              onClick={() => setActiveTab('login')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                activeTab === 'login' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                activeTab === 'register' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Terminal</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-fin-border text-xs text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-poly-blue transition-colors disabled:opacity-50"
                  placeholder="operator@alpha-mode.ai"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-fin-border text-xs text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-poly-blue transition-colors disabled:opacity-50"
                  placeholder="••••••••••••"
                />
              </div>
              
              {activeTab === 'register' && (
                <div className="mt-2 space-y-1.5 px-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-300",
                          strength >= level 
                            ? strength === 4 ? "bg-kalshi-green" : strength >= 2 ? "bg-amber-500" : "bg-kalshi-red"
                            : "bg-zinc-800"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                    <span className={cn(
                      strength === 0 ? "text-zinc-600" : strength === 4 ? "text-kalshi-green" : strength >= 2 ? "text-amber-500" : "text-kalshi-red"
                    )}>
                      Entropy: {strength === 0 ? 'None' : strength === 4 ? 'Optimal' : strength >= 2 ? 'Moderate' : 'Critical'}
                    </span>
                    <span className="text-zinc-600">Min 12 Chars</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-kalshi-red/10 border border-kalshi-red/20 text-kalshi-red text-[10px] font-bold px-3 py-2 rounded-md animate-in slide-in-from-top-1">
                ERROR: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Configuring Session...</span>
                </>
              ) : (
                <span>{activeTab === 'login' ? 'Initiate Session' : 'Deploy Account'}</span>
              )}
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-fin-border flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 border border-fin-border rounded-full shadow-inner">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Agents powered by</span>
              <div className="flex items-center space-x-1.5 pl-1.5 border-l border-zinc-700">
                <span style={{ color: currentProvider.color }}>{providerIcon(currentProvider.id)}</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{currentProvider.name}</span>
                <span className="text-zinc-600 text-[10px]">{currentProvider.models.find(m => m.id === aiProvider.model)?.name || aiProvider.model}</span>
              </div>
            </div>
            <div className="flex items-center justify-center text-[10px] text-zinc-600 space-x-1">
              <Lock size={10} />
              <span>Quantum-Safe End-to-End Encryption</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
