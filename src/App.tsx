import { Header } from './components/layout/Header/Header';
import { DraggableWidgetGrid } from './components/layout/DraggableWidgetGrid';
import { BootSequence } from './components/layout/BootSequence';
import { UltimateInsightsCard } from './components/widgets/UltimateInsightsCard';
import { AuthModal } from './components/ui/AuthModal';
import { TutorialOverlay } from './components/ui/TutorialOverlay';
import { MobileNav } from './components/layout/MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useMarketStore } from './store';
import { useSimulatorSync } from './hooks/useSimulatorSync';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { TUTORIAL_STEPS } from './config/tutorialSteps';
import React, { useCallback, useEffect, useState } from 'react';
import { measureRender, logSlowRenders } from './lib/perf';
import { WifiOff, X } from 'lucide-react';

// Initialize performance monitoring in development
if (process.env.NODE_ENV !== 'production') {
  logSlowRenders();
}

const AppBase: React.FC = () => {
  // Sync simulator data to global stores
  useSimulatorSync();
  
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
          <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-[100] px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-[1900px] mx-auto">
              <div className="bg-amber-500/95 backdrop-blur-md text-black px-4 py-2 rounded-lg flex items-center justify-between shadow-lg border border-amber-400/50">
                <div className="flex items-center space-x-3">
                  <WifiOff size={16} className="text-black/70" />
                  <span className="text-sm font-semibold tracking-tight">
                    Connection lost — data may be stale
                  </span>
                </div>
                <button 
                  onClick={() => setShowOfflineBanner(false)}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {!isBooting && <MobileNav />}

        {/* Global Overlays */}
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
      </div>
    </>
  );
};

const App = React.memo(measureRender(AppBase, 'App'));
export default App;

