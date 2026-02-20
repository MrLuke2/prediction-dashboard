import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Zap, DollarSign, BarChart3, ShieldCheck, Brain, Eye, ShieldAlert, ChevronDown } from 'lucide-react';
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

// Flatten all models across all providers into a single selectable list
function getAllModels() {
  const items: { providerId: AIProviderId; model: (typeof AI_PROVIDERS)[0]['models'][0] }[] = [];
  for (const provider of AI_PROVIDERS) {
    for (const model of provider.models) {
      items.push({ providerId: provider.id, model });
    }
  }
  return items;
}

const AgentModelSelector: React.FC<{
  role: AgentConfigRole;
  assignment: AgentModelAssignment;
  onChange: (role: AgentConfigRole, assignment: AgentModelAssignment) => void;
}> = ({ role, assignment, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const meta = AGENT_META[role];
  const allModels = getAllModels();
  const currentProvider = AI_PROVIDERS.find(p => p.id === assignment.providerId);
  const currentModel = currentProvider?.models.find(m => m.id === assignment.modelId);

  return (
    <div className="rounded-xl border border-fin-border bg-zinc-950 overflow-hidden">
      {/* Agent Header */}
      <div className="flex items-center space-x-3 p-4 bg-zinc-900/40 border-b border-fin-border/50">
        <div 
          className="p-2 rounded-lg" 
          style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white uppercase tracking-wider">{meta.label}</div>
          <div className="text-[9px] text-zinc-500 truncate">{meta.description}</div>
        </div>
      </div>

      {/* Model Picker */}
      <div className="p-4 space-y-2">
        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Assigned Model</label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentProvider?.color }} />
            <span className="text-[11px] font-bold text-white">{currentModel?.name || assignment.modelId}</span>
            <span className="text-[9px] text-zinc-500">{currentProvider?.name}</span>
          </div>
          <ChevronDown size={12} className={cn("text-zinc-500 transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pt-1 max-h-48 overflow-y-auto custom-scrollbar">
                {AI_PROVIDERS.map(provider => (
                  <div key={provider.id}>
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2 pt-2 pb-1 flex items-center space-x-1.5">
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: provider.color }} />
                      <span>{provider.name}</span>
                    </div>
                    {provider.models.map(model => {
                      const isActive = assignment.providerId === provider.id && assignment.modelId === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            onChange(role, { providerId: provider.id, modelId: model.id });
                            setIsOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all",
                            isActive 
                              ? "bg-poly-blue/10 text-white" 
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold">{model.name}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[8px] font-bold">
                            <span className={cn(
                              model.latency === 'Sub-second' ? 'text-kalshi-green' : 'text-zinc-500'
                            )}>
                              <Zap size={7} className="inline mr-0.5" />{model.latency}
                            </span>
                            <span className={cn(
                              model.reasoning === 'Elite' ? 'text-purple-400' : 'text-zinc-500'
                            )}>
                              <BarChart3 size={7} className="inline mr-0.5" />{model.reasoning}
                            </span>
                            <span className="text-zinc-500">
                              <DollarSign size={7} className="inline" />{model.cost === 'Low' ? '$' : model.cost === 'Medium' ? '$$' : '$$$'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Model Specs */}
        {currentModel && (
          <div className="grid grid-cols-3 gap-2 px-1 pt-2">
            <div className="text-center">
              <div className="text-[7px] font-bold text-zinc-600 uppercase">Reasoning</div>
              <div className={cn("text-[9px] font-black", currentModel.reasoning === 'Elite' ? 'text-purple-400' : 'text-zinc-300')}>{currentModel.reasoning}</div>
            </div>
            <div className="text-center">
              <div className="text-[7px] font-bold text-zinc-600 uppercase">Latency</div>
              <div className={cn("text-[9px] font-black", currentModel.latency === 'Sub-second' ? 'text-kalshi-green' : 'text-zinc-300')}>{currentModel.latency}</div>
            </div>
            <div className="text-center">
              <div className="text-[7px] font-bold text-zinc-600 uppercase">Cost</div>
              <div className="text-[9px] font-black text-zinc-300">{currentModel.cost}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export const ModelConsole: React.FC = () => {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-zinc-950 border-l border-fin-border z-[160] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-fin-border flex items-center justify-between bg-zinc-900/50 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-poly-blue/10 rounded-lg">
                  <Cpu className="text-poly-blue" size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Agent Model Console</h2>
                  <p className="text-[10px] text-zinc-500 font-mono">PER-AGENT NEURAL PIPELINE CONFIGURATION</p>
                </div>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent Council — Model Assignments</h3>
                <span className="text-[9px] font-mono text-poly-blue animate-pulse">LIVE CONFIG</span>
              </div>

              {AGENT_ROLES.map(role => (
                <AgentModelSelector
                  key={role}
                  role={role}
                  assignment={agentModels[role]}
                  onChange={setAgentModel}
                />
              ))}

              <section className="p-4 rounded-xl bg-poly-blue/5 border border-poly-blue/10 space-y-3 mt-4">
                <div className="flex items-center space-x-2 text-poly-blue">
                  <ShieldCheck size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Advanced Pipeline Policy</h4>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Assign different AI models to each agent for optimized performance. Example: use <span className="text-white font-bold">Gemini 2.5 Flash</span> for the Fundamentalist (speed), <span className="text-white font-bold">Claude 3.5 Sonnet</span> for Sentiment (nuance), and <span className="text-white font-bold">GPT-4o</span> for Risk (reliability).
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-fin-border bg-zinc-900/30 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 font-mono uppercase">Pipeline Status</span>
                <span className="text-[10px] font-bold text-kalshi-green flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-kalshi-green mr-2 animate-pulse" />
                  ALL AGENTS NOMINAL
                </span>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest"
              >
                Close Console
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
