import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  name: string;
  status: string;
  color: string;
  uptime: string;
  lastAction: string;
}

const AGENTS: Agent[] = [
  { name: 'Fundamentalist', status: 'Active', color: 'bg-poly-blue', uptime: '99.99%', lastAction: 'Analyzed FOMC Minutes' },
  { name: 'Sentiment', status: 'Parsing', color: 'bg-kalshi-green', uptime: '98.42%', lastAction: 'Scanned 4.2k X posts' },
  { name: 'Risk', status: 'Calc', color: 'bg-kalshi-red', uptime: '100%', lastAction: 'Hedged BTC exposure' }
];

export const AgentStatusBar: React.FC = () => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div id="network-status" className="hidden lg:flex items-center space-x-2 shrink-0">
      {AGENTS.map((agent) => (
        <div 
          key={agent.name} 
          className="relative group"
          onMouseEnter={() => setHoveredAgent(agent.name)}
          onMouseLeave={() => setHoveredAgent(null)}
        >
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-fin-border whitespace-nowrap cursor-help transition-colors hover:border-zinc-600">
            <div className={`w-2 h-2 rounded-full ${agent.color} animate-pulse shadow-[0_0_8px_rgba(var(--color-${agent.name === 'Fundamentalist' ? 'poly-blue' : (agent.name === 'Sentiment' ? 'kalshi-green' : 'kalshi-red')}-rgb),0.5)]`}></div>
            <span className="text-[10px] font-medium text-text-muted uppercase">
              <span className="hidden xl:inline">{agent.name}: </span>
              <span className="text-white">{agent.status}</span>
            </span>
          </div>

          <AnimatePresence>
            {hoveredAgent === agent.name && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 p-3 bg-zinc-950 border border-fin-border rounded-lg shadow-2xl z-[70] min-w-[180px]"
              >
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center pb-1 border-b border-fin-border">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Agent Uptime</span>
                    <span className="text-[10px] font-mono text-kalshi-green font-bold">{agent.uptime}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Last Instruction</span>
                    <p className="text-[10px] text-white leading-relaxed italic">
                      "{agent.lastAction}"
                    </p>
                  </div>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute -top-1 right-8 w-2 h-2 bg-zinc-950 border-t border-l border-fin-border rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
