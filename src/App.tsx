import { Header } from './components/layout/Header/Header';
import { DraggableWidgetGrid } from './components/layout/DraggableWidgetGrid';
import { BootSequence } from './components/layout/BootSequence';
import { UltimateInsightsCard } from './components/widgets/UltimateInsightsCard';
import { AuthModal } from './components/ui/AuthModal';
import { ControlCenter } from './components/layout/Header/ControlCenter';
import { TutorialOverlay } from './components/ui/TutorialOverlay';
import { MobileNav } from './components/layout/MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useMarketStore, useNotificationStore, useTradeStore } from './store';
import { useSimulatorSync } from './hooks/useSimulatorSync';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { TUTORIAL_STEPS } from './config/tutorialSteps';
import { AI_PROVIDERS } from './config/aiProviders';
import { ToastContainer } from './components/ui/Toast/ToastContainer';
import React, { useCallback, useEffect, useState } from 'react';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard';
import { measureRender, logSlowRenders } from './lib/perf';
import { WifiOff, X, AlertTriangle } from 'lucide-react';

// Initialize performance monitoring in development
if (process.env.NODE_ENV !== 'production') {
  logSlowRenders();
}

const AppBase: React.FC = () => {
  // Sync simulator data to global stores
  useSimulatorSync();

  // Global keyboard shortcuts
  useGlobalKeyboard();
  
  // Connection monitoring
  const { isOnline } = useConnectionStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);

  // UI Store State
  const isBooting = useUIStore(state => state.isBooting);
  const setBooting = useUIStore(state => state.setBooting);
  const isTutorialOpen = useUIStore(state => state.isTutorialOpen);
  const setTutorialOpen = useUIStore(state => state.setTutorialOpen);
  const isAuthOpen = useUIStore(state => state.isAuthOpen);
  const setAuthOpen = useUIStore(state => state.setAuthOpen);
  const mobileTab = useUIStore(state => state.mobileTab);
  const selectedMarket = useMarketStore(state => state.selectedMarket);
  const emergencyActive = useTradeStore(state => state.emergencyActive);
  const tradeStatus = useTradeStore(state => state.tradeStatus);
  const handleMarketClose = useCallback(() => useMarketStore.getState().setSelectedMarket(null), []);

  const handleBootComplete = useCallback(() => setBooting(false), [setBooting]);
  const handleAuthClose = useCallback(() => setAuthOpen(false), [setAuthOpen]);
  const handleTutorialClose = useCallback(() => setTutorialOpen(false), [setTutorialOpen]);

  // Reset banner visibility when back online
  useEffect(() => {
    if (isOnline) setShowOfflineBanner(true);
  }, [isOnline]);

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            exit={{ opacity: 0, transition: { duration: 0.8 } }} 
            className="fixed inset-0 z-[200]"
          >
            <BootSequence onComplete={handleBootComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen overflow-hidden text-text-main font-sans bg-brand-fin-bg relative">
        <Header />

        <main className="flex-1 overflow-hidden relative bg-brand-fin-bg" role="main">
          <motion.div 
            className="h-full w-full max-w-[1900px] mx-auto p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: !isBooting ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <DraggableWidgetGrid mobileTab={mobileTab} />
          </motion.div>
        </main>

        {/* Connection Status Banner */}
        {!isOnline && showOfflineBanner && !isBooting && (
          <div className="fixed bottom-16 left-0 right-0 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-amber-500 text-black px-4 py-1.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <WifiOff size={14} className="text-black/70" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Connection lost — data may be stale
                </span>
              </div>
              <button 
                onClick={() => setShowOfflineBanner(false)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {!isBooting && <MobileNav />}

        {/* Global Overlays */}
        <ToastContainer />

        <AnimatePresence>
          {isAuthOpen && <AuthModal isOpen={isAuthOpen} onClose={handleAuthClose} />}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMarket && (
            <UltimateInsightsCard 
              market={selectedMarket} 
              onClose={handleMarketClose} 
            />
          )}
        </AnimatePresence>

        <TutorialOverlay 
          steps={TUTORIAL_STEPS} 
          isOpen={isTutorialOpen} 
          onClose={handleTutorialClose} 
        />

        <ControlCenter />

        {/* Phase B: Emergency Standby Overlay */}
        <AnimatePresence>
          {emergencyActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] pointer-events-none border-[12px] border-kalshi-red shadow-[inset_0_0_150px_rgba(239,68,68,0.4)] animate-pulse"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/80 backdrop-blur-xl border border-kalshi-red/50 px-8 py-4 rounded-2xl flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-3 text-kalshi-red">
                  <AlertTriangle size={32} className="animate-bounce" />
                  <span className="text-3xl font-black tracking-tighter uppercase italic">Neutralized</span>
                </div>
                <div className="text-[10px] font-mono tracking-[0.3em] text-white/50 uppercase">
                   Trade History Overridden — Biometric Standby Active
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const App = React.memo(measureRender(AppBase, 'App'));
export default App;

