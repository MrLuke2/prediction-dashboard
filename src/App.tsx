import { Header } from './components/layout/Header/Header';
import { DraggableWidgetGrid } from './components/layout/DraggableWidgetGrid';
import { BootSequence } from './components/layout/BootSequence';
import { UltimateInsightsCard } from './components/widgets/UltimateInsightsCard';
import { AuthModal } from './components/ui/AuthModal';
import { TutorialOverlay } from './components/ui/TutorialOverlay';
import { MobileNav, MobileTab } from './components/layout/MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useMarketStore } from './store';
import { useSimulatorSync } from './hooks/useSimulatorSync';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TUTORIAL_STEPS } from './config/tutorialSteps';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { measureRender, logSlowRenders } from './lib/perf';

// Initialize performance monitoring in development
if (process.env.NODE_ENV !== 'production') {
  logSlowRenders();
}

const AppBase: React.FC = () => {
  // Sync simulator data to global stores
  useSimulatorSync();
  
  // Responsive checks
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const [mobileTab, setMobileTab] = useState<MobileTab>('overview');

  // UI Store State
  const isBooting = useUIStore(state => state.isBooting);
  const setBooting = useUIStore(state => state.setBooting);
  const isTutorialOpen = useUIStore(state => state.isTutorialOpen);
  const setTutorialOpen = useUIStore(state => state.setTutorialOpen);
  const isAuthOpen = useUIStore(state => state.isAuthOpen);
  const setAuthOpen = useUIStore(state => state.setAuthOpen);

  const selectedMarket = useMarketStore(state => state.selectedMarket);
  const handleMarketClose = useCallback(() => useMarketStore.getState().setSelectedMarket(null), []);

  const handleBootComplete = useCallback(() => setBooting(false), [setBooting]);
  const handleAuthClose = useCallback(() => setAuthOpen(false), [setAuthOpen]);
  const handleTutorialClose = useCallback(() => setTutorialOpen(false), [setTutorialOpen]);

  const mainContainerStyle = useMemo(() => ({
    opacity: !isBooting ? 1 : 0
  }), [isBooting]);

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
            animate={mainContainerStyle}
            transition={{ duration: 0.5 }}
          >
            <DraggableWidgetGrid mobileTab={mobileTab} />
          </motion.div>
        </main>

        {/* Mobile Navigation */}
        {!isBooting && <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />}

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

