import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Zap, DollarSign, BarChart3, ShieldCheck, Brain, Eye, ShieldAlert, ChevronDown, Sliders } from 'lucide-react';
import { useUIStore } from '../../../store';
import { AI_PROVIDERS, AgentConfigRole, AIProviderId, AgentModelAssignment } from '../../../config/aiProviders';
import { cn } from '../../../lib/utils';

const AGENT_META: Record<AgentConfigRole, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  fundamentalist: {
    label: 'Fundamentalist',
    description: 'Deep market structure analysis, order book depth, and on-chain data interpretation.',
    icon: <Brain size={16} />,
    color: '#8B5CF6'
  },
  sentiment: {
    label: 'Sentiment Analyst',
    description: 'Social signal processing, news sentiment scoring, and narrative trend detection.',
    icon: <Eye size={16} />,
    color: '#F59E0B'
  },
  risk: {
    label: 'Risk Manager',
    description: 'Position sizing via Kelly Criterion, drawdown limits, and portfolio correlation analysis.',
    icon: <ShieldAlert size={16} />,
    color: '#EF4444'
  }
};

const AGENT_ROLES: AgentConfigRole[] = ['fundamentalist', 'sentiment', 'risk'];

const AgentModelSelector: React.FC<{
  role: AgentConfigRole;
  assignment: AgentModelAssignment;
  onChange: (role: AgentConfigRole, assignment: AgentModelAssignment) => void;
}> = ({ role, assignment, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const meta = AGENT_META[role] || AGENT_META.fundamentalist;
  const currentProvider = assignment 
    ? (AI_PROVIDERS.find(p => p.id === assignment.providerId) || AI_PROVIDERS[0])
    : AI_PROVIDERS[0];
  
  const currentModelName = assignment?.modelId || currentProvider.defaultModel;

  return (
    <div className="rounded-xl border border-fin-border bg-zinc-950 overflow-hidden shadow-lg transition-all hover:border-zinc-700">
      {/* Agent Header */}
      <div className="flex items-center space-x-3 p-4 bg-zinc-900/40 border-b border-fin-border/50">
        <div 
          className="p-2 rounded-lg shadow-inner" 
          style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{meta.label}</div>
          <div className="text-[9px] text-zinc-500 leading-tight pr-4">{meta.description}</div>
        </div>
      </div>

      {/* Model Picker */}
      <div className="p-4 space-y-2">
        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Assigned Neural Model</label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: currentProvider?.color, color: currentProvider?.color }} />
            <div className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-bold text-white uppercase tracking-tighter">{currentModelName.replace(/-/g, ' ')}</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{currentProvider?.name}</span>
            </div>
          </div>
          <ChevronDown size={14} className={cn("text-zinc-600 transition-transform relative z-10 group-hover:text-zinc-400", isOpen && "rotate-180")} />
          
          {/* Subtle hover background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 pt-1.5 max-h-60 overflow-y-auto custom-scrollbar px-0.5">
                {AI_PROVIDERS.map(provider => (
                  <div key={provider.id} className="mb-2 last:mb-0">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 flex items-center space-x-2 bg-zinc-900/40 rounded-t-md">
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: provider.color }} />
                      <span>{provider.name} Stack</span>
                    </div>
                    <div className="bg-zinc-900/20 border-x border-b border-zinc-900/50 rounded-b-md p-1 space-y-0.5">
                        {provider.models.map(model => {
                        const isActive = assignment?.providerId === provider.id && assignment?.modelId === model;
                        return (
                            <button
                            key={model}
                            onClick={() => {
                                onChange(role, { providerId: provider.id, modelId: model });
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded text-left transition-all",
                                isActive 
                                    ? "bg-white/5 text-white border border-white/10" 
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                            )}
                            >
                            <span className="text-[10px] font-bold uppercase tracking-tight">{model.replace(/-/g, ' ')}</span>
                            {isActive && <div className="w-1 h-1 rounded-full bg-kalshi-green shadow-[0_0_4px_#10b981]" />}
                            </button>
                        );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Specs are now simplified since we don't have static metadata for every model in config */}
        <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 text-center">
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Compute Cost</div>
                <div className="text-[9px] font-bold text-zinc-300">VARIABLE RATE</div>
            </div>
            <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 text-center">
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Latency Tier</div>
                <div className="text-[9px] font-bold text-kalshi-green">ULTRA-LOW</div>
            </div>
        </div>
      </div>
    </div>
  );
};


export const ControlCenter: React.FC = () => {
  const isSettingsOpen = useUIStore(state => state.isSettingsOpen);
  const setSettingsOpen = useUIStore(state => state.setSettingsOpen);
  const agentModels = useUIStore(state => state.agentModels);
  const setAgentModel = useUIStore(state => state.setAgentModel);

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-fin-bg border-l border-fin-border z-[160] shadow-2xl flex flex-col overflow-hidden"
            data-testid="control-center-sidebar"
          >
            {/* Header */}
            <div className="p-6 border-b border-fin-border flex items-center justify-between bg-zinc-950/50 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-kalshi-green/10 rounded-xl border border-kalshi-green/20">
                  <Sliders className="text-kalshi-green" size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tighter text-white italic">Control Center</h2>
                  <p className="text-[9px] text-zinc-500 font-mono tracking-widest">SYSTEM PARAMETERS & AGENT COUNCIL</p>
                </div>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
              
              {/* Settings Section: AI AGENTS */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Cpu size={14} className="text-poly-blue" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest underline decoration-poly-blue/50 underline-offset-4">Agent Neural Pipeline</h3>
                    </div>
                    <span className="text-[9px] font-mono text-kalshi-green bg-kalshi-green/5 px-2 py-0.5 rounded border border-kalshi-green/10">ACTIVE CONFIG</span>
                </div>

                <div className="space-y-4">
                    {AGENT_ROLES.map(role => (
                        <AgentModelSelector
                        key={role}
                        role={role}
                        assignment={agentModels[role]}
                        onChange={setAgentModel}
                        />
                    ))}
                </div>
              </section>

              {/* Maintenance / Policy Section */}
              <section className="p-5 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={80} className="text-white" />
                </div>
                
                <div className="flex items-center space-x-2 text-zinc-400 relative z-10">
                  <ShieldCheck size={16} className="text-kalshi-green" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Protocol Policy v4.5</h4>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium relative z-10">
                  Neural model assignments are synchronized across the global cluster. Select high-reasoning models for <span className="text-zinc-300 font-bold italic">Deep Analysis</span> and low-latency models for <span className="text-zinc-300 font-bold italic">Real-time Execution</span>.
                </p>
                <div className="pt-2 flex space-x-2 relative z-10">
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-kalshi-green w-full" />
                    </div>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-poly-blue w-2/3" />
                    </div>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-1/2" />
                    </div>
                </div>
              </section>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                      <div className="text-[8px] text-zinc-600 font-black uppercase mb-1">System Load</div>
                      <div className="text-xs font-mono text-white">12.4% CPU</div>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                      <div className="text-[8px] text-zinc-600 font-black uppercase mb-1">Relay Latency</div>
                      <div className="text-xs font-mono text-white">14ms AVG</div>
                  </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-fin-border bg-zinc-950 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Global Status</span>
                <span className="text-[10px] font-bold text-kalshi-green flex items-center uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-kalshi-green mr-2 animate-pulse" />
                  Cluster Nominal
                </span>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black border border-white/10 rounded-xl transition-all uppercase tracking-widest active:scale-95 shadow-lg"
              >
                Close Systems
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
