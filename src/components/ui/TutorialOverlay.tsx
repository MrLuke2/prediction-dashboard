import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      updateRect();
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentStepIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') onClose();
  };

  const updateRect = () => {
    const step = steps[currentStepIndex];
    if (step) {
      const element = document.getElementById(step.targetId);
      if (element) {
        // Ensure element is visible
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update rect after a tiny delay for scroll/animation
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 100);
      }
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen || !targetRect) return null;

  const currentStep = steps[currentStepIndex];
  const CARD_WIDTH = 320;
  const MARGIN = 10;

  // Calculate popover position
  let popoverStyle: React.CSSProperties = {};
  const spacing = 16;
  
  if (currentStep.position === 'bottom') {
    let leftPos = targetRect.left + (targetRect.width / 2) - (CARD_WIDTH / 2);
    // Clamp Left
    leftPos = Math.max(MARGIN, Math.min(window.innerWidth - CARD_WIDTH - MARGIN, leftPos));
    
    popoverStyle = {
      top: targetRect.bottom + spacing,
      left: leftPos,
    };
  } else if (currentStep.position === 'top') {
    let leftPos = targetRect.left + (targetRect.width / 2) - (CARD_WIDTH / 2);
    // Clamp Left
    leftPos = Math.max(MARGIN, Math.min(window.innerWidth - CARD_WIDTH - MARGIN, leftPos));

    popoverStyle = {
      top: targetRect.top - spacing - 160, // Assuming height ~150
      left: leftPos,
    };
  } else if (currentStep.position === 'left') {
    popoverStyle = {
      top: targetRect.top,
      left: targetRect.left - CARD_WIDTH - spacing,
    };
  } else if (currentStep.position === 'right') {
      popoverStyle = {
        top: targetRect.top,
        left: targetRect.right + spacing,
      };
  }
  
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      {/* Focus Outline */}
      <div 
        className="absolute transition-all duration-300 ease-in-out border-2 border-poly-blue rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
        aria-hidden="true"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      ></div>

      {/* Tooltip Card */}
      <div 
        className="absolute bg-white text-zinc-900 p-5 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{
            ...popoverStyle,
            width: CARD_WIDTH
        }}
      >
        <div className="flex justify-between items-start mb-2">
            <h3 id="tutorial-title" className="font-bold text-lg">{currentStep.title}</h3>
            <button 
                onClick={onClose} 
                aria-label="Close tutorial"
                className="text-zinc-400 hover:text-zinc-900 brand-focus-ring rounded-md p-1"
            >
                <X size={18} />
            </button>
        </div>
        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
            {currentStep.description}
        </p>
        
        <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400 font-mono" aria-label={`Step ${currentStepIndex + 1} of ${steps.length}`}>
                {currentStepIndex + 1} / {steps.length}
            </span>
            <div className="flex space-x-2">
                <button 
                    onClick={handlePrev} 
                    disabled={currentStepIndex === 0}
                    aria-label="Previous step"
                    className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed brand-focus-ring"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={handleNext}
                    aria-label={currentStepIndex === steps.length - 1 ? 'Finish tutorial' : 'Next step'}
                    className="flex items-center px-4 py-1.5 bg-poly-blue text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors brand-focus-ring"
                >
                    {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    {currentStepIndex !== steps.length - 1 && <ChevronRight size={16} className="ml-1" aria-hidden="true" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};