import { LayoutGrid, HelpCircle, UserCircle, RotateCcw } from 'lucide-react';
import { useUIStore, useLayoutStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';

export const HeaderActions: React.FC = () => {
  const { 
    isEditMode, setEditMode, 
    setTutorialOpen, 
    setAuthOpen,
    setSwapSource 
  } = useUIStore();

  const { resetLayout } = useLayoutStore();

  const handleEditToggle = () => {
    setEditMode(!isEditMode);
    setSwapSource(null);
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
      {/* Reset Layout button (Edit Mode Only) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetLayout}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-brand-fin-border bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px] font-bold uppercase tracking-wider"
            aria-label="Reset dashboard layout to default"
          >
            <RotateCcw size={14} />
            <span className="hidden lg:inline">Reset</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Layout Toggle */}
      <motion.button
        id="layout-toggle"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleEditToggle}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all brand-focus-ring
          ${isEditMode 
            ? 'bg-brand-poly-blue text-white border-brand-poly-blue shadow-lg shadow-brand-poly-blue/20' 
            : 'bg-zinc-900 text-zinc-400 border-brand-fin-border hover:text-white hover:border-zinc-600'}
        `}
        aria-label={isEditMode ? 'Exit layout editing mode' : 'Enter layout editing mode'}
      >
        <LayoutGrid size={14} className={isEditMode ? 'animate-pulse' : ''} aria-hidden="true" />
        <span className="hidden sm:inline">{isEditMode ? 'Finish Sync' : 'Edit Layout'}</span>
      </motion.button>

      {/* Tutorial Button */}
      <button 
        onClick={() => setTutorialOpen(true)}
        className="flex items-center space-x-2 text-text-muted hover:text-white transition-colors text-xs font-medium px-2 py-1 brand-focus-ring rounded-md"
        aria-label="Open terminal tutorial"
      >
        <HelpCircle size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Help</span>
      </button>

      {/* Auth / Sign In */}
      <button 
        onClick={() => setAuthOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-kalshi-green whitespace-nowrap hover:bg-kalshi-green/10 transition-all group shadow-[0_0_2px_rgba(16,185,129,0.3)] hover:shadow-[0_0_10px_rgba(16,185,129,0.4)] brand-focus-ring"
        aria-label="Sign in to your account"
      >
        <UserCircle size={16} className="text-kalshi-green transition-transform group-hover:scale-110" aria-hidden="true" />
        <span className="text-[10px] font-medium text-text-muted uppercase">
          <span className="hidden xl:inline">Commander: </span>
          <span className="text-white">Relay-1</span>
        </span>
      </button>
    </div>
  );
};
