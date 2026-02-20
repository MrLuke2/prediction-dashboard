import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Bot, Sparkles, Cpu, Zap } from 'lucide-react';
import { useUIStore, useNotificationStore } from '../../store';
import { AI_PROVIDERS, AIProviderId, AIProviderSelection } from '../../config/aiProviders';
import { cn } from '../../lib/utils';

interface AIProviderSelectorProps {
  mode?: 'compact' | 'full';
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({ mode = 'compact' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { aiProvider, setAIProvider } = useUIStore();
  const { addToast } = useNotificationStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentProvider = AI_PROVIDERS.find(p => p.id === aiProvider.providerId) || AI_PROVIDERS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProviderSelect = (providerId: AIProviderId) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)!;
    setAIProvider({ providerId, model: provider.defaultModel });
    addToast({
        type: 'agent',
        title: 'Agent Synchronized',
        message: `${provider.name} agents active`,
        providerId
    });
  };

  const handleModelSelect = (providerId: AIProviderId, model: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)!;
    setAIProvider({ providerId, model });
    addToast({
        type: 'agent',
        title: 'Model Updated',
        message: `${provider.name} model: ${model}`,
        providerId
    });
  };

  const getProviderIcon = (id: AIProviderId) => {
    switch (id) {
      case 'anthropic': return <Bot size={16} />;
      case 'openai': return <Zap size={16} />;
      case 'gemini': return <Sparkles size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  if (mode === 'compact') {
    return (
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          data-testid="ai-provider-selector-trigger"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-fin-border hover:border-zinc-600 transition-colors"
        >
          <div 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" 
            style={{ backgroundColor: currentProvider.color }}
          />
          <span className="text-[10px] font-bold text-white uppercase tracking-tight">
            {currentProvider.name} <span className="text-text-muted font-normal ml-1">/ {aiProvider.model}</span>
          </span>
          <ChevronDown size={12} className={cn("text-text-muted transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-64 bg-zinc-950 border border-fin-border rounded-xl shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="space-y-1">
                    <button
                      onClick={() => handleProviderSelect(provider.id)}
                      data-testid={`ai-provider-option-${provider.id}`}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg transition-all group",
                        aiProvider.providerId === provider.id 
                          ? "bg-zinc-900 ring-1 ring-inset" 
                          : "hover:bg-zinc-900/50"
                      )}
                      style={{ borderColor: aiProvider.providerId === provider.id ? provider.color : 'transparent' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 rounded-md bg-zinc-800 text-text-muted group-hover:text-white transition-colors" style={{ color: aiProvider.providerId === provider.id ? provider.color : undefined }}>
                          {getProviderIcon(provider.id)}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white tracking-tight">{provider.name}</p>
                          <p className="text-[10px] text-text-muted line-clamp-1">{provider.description}</p>
                        </div>
                      </div>
                      {aiProvider.providerId === provider.id && <Check size={14} style={{ color: provider.color }} />}
                    </button>

                    {aiProvider.providerId === provider.id && (
                      <div className="ml-10 pr-2 pb-2">
                        <select
                          value={aiProvider.model}
                          data-testid="ai-model-select"
                          onChange={(e) => handleModelSelect(provider.id, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-zinc-600"
                        >
                          {provider.models.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full Mode
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {AI_PROVIDERS.map((provider) => (
        <div
          key={provider.id}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer bg-zinc-900/50",
            aiProvider.providerId === provider.id 
              ? "border-opacity-100 ring-2" 
              : "border-fin-border hover:border-zinc-700"
          )}
          style={{ 
            borderColor: aiProvider.providerId === provider.id ? provider.color : undefined,
            boxShadow: aiProvider.providerId === provider.id ? `0 0 0 2px ${provider.color}44` : undefined
          }}
          onClick={() => handleProviderSelect(provider.id)}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-xl bg-zinc-800" style={{ color: provider.color }}>
              {getProviderIcon(provider.id)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{provider.name}</h3>
              <p className="text-[10px] text-text-muted">{provider.id === 'anthropic' ? 'Advanced' : provider.id === 'openai' ? 'Standard' : 'Multimodal'}</p>
            </div>
          </div>
          
          <p className="text-xs text-text-muted leading-relaxed mb-6 h-8">
            {provider.description}
          </p>

          <div onClick={(e) => e.stopPropagation()}>
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Model Intelligence</label>
            <select
              value={aiProvider.providerId === provider.id ? aiProvider.model : provider.defaultModel}
              onChange={(e) => handleModelSelect(provider.id, e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600"
            >
              {provider.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};
