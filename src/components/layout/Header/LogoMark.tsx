import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const LogoMark: React.FC = () => {
  return (
    <div 
      id="header-logo" 
      className="flex items-center space-x-3 shrink-0 mr-8 select-none cursor-pointer group"
      role="banner"
      aria-label="Agent Predict Alpha Terminal Home"
    >
      <div className="relative">
        <motion.div 
          className="w-8 h-8 bg-brand-poly-blue rounded-lg flex items-center justify-center shadow-lg shadow-poly-blue/20 relative z-10 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated Gradient Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
            animate={{ 
              x: ['-100%', '100%'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 3
            }}
          />
          <Activity className="text-white relative z-10" size={20} />
        </motion.div>
        
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-brand-poly-blue opacity-20 blur-lg rounded-lg group-hover:opacity-40 transition-opacity" />
      </div>

      <div className="hidden sm:block">
        <h1 className="font-sans font-bold text-xl tracking-tight text-white leading-none">
          Agent<span className="bg-gradient-to-r from-poly-blue via-poly-blue to-kalshi-green bg-clip-text text-transparent">Predict</span>
        </h1>
        <div className="flex items-center mt-1 space-x-1.5">
          <span className="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase">Alpha Terminal</span>
          <div className="w-1 h-1 rounded-full bg-kalshi-green animate-pulse" />
        </div>
      </div>
    </div>
  );
};
