import React from 'react';
import { X, Github, Mail, Smartphone, ShieldCheck, Lock, Chrome } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

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
        
        {/* Header decoration */}
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
                <h2 id="auth-modal-title" className="text-2xl font-bold text-white tracking-tight mb-2">Agent Access</h2>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-[260px]">
                    Authenticate to access the Alpha Terminal and execute arbitrage strategies on the A2UI Protocol.
                </p>
            </div>

            <div className="space-y-3">
                <button 
                    aria-label="Sign in with Google"
                    className="w-full group relative flex items-center justify-center space-x-3 bg-white text-black font-bold py-3.5 rounded-lg hover:bg-zinc-200 transition-all duration-200 brand-focus-ring"
                >
                    <Chrome size={18} className="text-zinc-600 group-hover:text-black transition-colors" />
                    <span>Sign in with Google</span>
                </button>
                
                <button 
                    aria-label="Sign in with GitHub"
                    className="w-full group relative flex items-center justify-center space-x-3 bg-[#24292e] text-white font-bold py-3.5 rounded-lg border border-zinc-700 hover:bg-[#2f363d] transition-all duration-200 brand-focus-ring"
                >
                    <Github size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span>Sign in with GitHub</span>
                </button>
                
                <button 
                    aria-label="Sign in with Apple"
                    className="w-full group relative flex items-center justify-center space-x-3 bg-black text-white font-bold py-3.5 rounded-lg border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-200 brand-focus-ring"
                >
                    <Smartphone size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span>Sign in with Apple</span>
                </button>

                <div className="flex items-center justify-between px-2 py-1" aria-hidden="true">
                    <div className="h-px bg-fin-border flex-1"></div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase mx-4">Or</span>
                    <div className="h-px bg-fin-border flex-1"></div>
                </div>

                <button 
                    aria-label="Sign in with Email"
                    className="w-full group relative flex items-center justify-center space-x-3 bg-zinc-800 text-white font-bold py-3.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all duration-200 brand-focus-ring"
                >
                    <Mail size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span>Sign in with Email</span>
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-fin-border text-center">
                <div className="flex items-center justify-center text-[10px] text-zinc-500 space-x-1">
                    <Lock size={10} aria-hidden="true" />
                    <span>Encrypted Connection • SOC2 Compliant</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
