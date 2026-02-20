import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Bot, Zap, Sparkles } from 'lucide-react';
import { useUIStore } from '../../store';
import { AI_PROVIDERS, AIProviderId, AIProviderSelection } from '../../config/aiProviders';
import { cn } from '../../lib/utils';

interface AIProviderSelectorProps {
  mode?: 'compact' | 'full';
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  anthropic: <Bot size={16} />,
  openai: <Zap size={16} />,
  gemini: <Sparkles size={16} />,
};

const PROVIDER_ICONS_LARGE: Record<string, React.ReactNode> = {
  anthropic: <Bot size={24} />,
  openai: <Zap size={24} />,
  gemini: <Sparkles size={24} />,
};

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({ mode = 'compact' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { aiProvider, setAIProvider } = useUIStore();
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
  };

  const handleModelSelect = (providerId: AIProviderId, model: string) => {
    setAIProvider({ providerId, model });
  };

  if (mode === 'compact') {
    return (
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-fin-border hover:border-zinc-600 transition-colors"
        >
          <div 
            className="w-2 h-2 rounded-full shadow-lg" 
            style={{ 
                backgroundColor: currentProvider.color,
                boxShadow: `0 0 8px ${currentProvider.color}` 
            }}
          />
          <span className="text-[10px] font-bold text-white uppercase tracking-tight">
            {currentProvider.name} <span className="text-zinc-500 font-normal ml-1">/ {aiProvider.model}</span>
          </span>
          <ChevronDown size={12} className={cn("text-zinc-500 transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-72 bg-zinc-950 border border-fin-border rounded-xl shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="space-y-1">
                    <button
                      onClick={() => handleProviderSelect(provider.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg transition-all group",
                        aiProvider.providerId === provider.id 
                          ? "bg-zinc-900" 
                          : "hover:bg-zinc-900/50"
                      )}
                      style={{ 
                        boxShadow: aiProvider.providerId === provider.id ? `inset 0 0 0 1px ${provider.color}44` : undefined 
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 rounded-md bg-zinc-800" style={{ color: provider.color }}>
                          {PROVIDER_ICONS[provider.id]}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white tracking-tight">{provider.name}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{provider.description}</p>
                        </div>
                      </div>
                      {aiProvider.providerId === provider.id && <Check size={14} style={{ color: provider.color }} />}
                    </button>

                    {aiProvider.providerId === provider.id && (
                      <div className="ml-10 pr-2 pb-2">
                        <div className="flex flex-wrap gap-1">
                          {provider.models.map(model => (
                            <button
                              key={model}
                              onClick={() => handleModelSelect(provider.id, model)}
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold transition-colors",
                                aiProvider.model === model 
                                    ? "bg-white text-black" 
                                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                              )}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
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
      {AI_PROVIDERS.map((provider) => {
        const isSelected = aiProvider.providerId === provider.id;
        return (
          <div
            key={provider.id}
            className={cn(
              "p-5 rounded-2xl border transition-all cursor-pointer bg-zinc-900/40 relative overflow-hidden group",
              isSelected 
                ? "ring-2 ring-offset-2 ring-offset-black" 
                : "border-fin-border hover:border-zinc-700"
            )}
            style={{ 
              borderColor: isSelected ? provider.color : undefined,
            }}
            onClick={() => handleProviderSelect(provider.id)}
          >
            {isSelected && (
                <div className="absolute top-0 right-0 p-2">
                    <div className="bg-white rounded-full p-0.5" style={{ color: provider.color }}>
                        <Check size={12} strokeWidth={4} />
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-xl bg-zinc-800" style={{ color: provider.color }}>
                {PROVIDER_ICONS_LARGE[provider.id]}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{provider.name}</h3>
                <div 
                    className="h-1 w-8 rounded-full mt-1" 
                    style={{ backgroundColor: provider.color }}
                />
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              {provider.description}
            </p>

            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Neural Architecture</label>
              <div className="grid grid-cols-1 gap-1.5">
                {provider.models.map(model => (
                  <button
                    key={model}
                    onClick={() => handleModelSelect(provider.id, model)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all border",
                      isSelected && aiProvider.model === model 
                        ? "bg-white border-white text-black" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
