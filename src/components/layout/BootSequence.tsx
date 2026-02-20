import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [steps, setSteps] = React.useState<{ msg: string, status: 'pending' | 'done' }[]>([
    { msg: "INITIALIZING KERNEL...", status: 'pending' },
    { msg: "ESTABLISHING SECURE HANDSHAKE (TLS 1.3)...", status: 'pending' },
    { msg: "SYNCING WITH POLYGON RPC NODES...", status: 'pending' },
    { msg: "LOADING AGENT NEURAL WEIGHTS...", status: 'pending' },
    { msg: "CALIBRATING RISK ENGINE...", status: 'pending' },
    { msg: "ACCESS GRANTED.", status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = React.useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) {
      setTimeout(onComplete, 800);
      return;
    }

    const timeout = setTimeout(() => {
      setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, status: 'done' } : s));
      setCurrentStep(prev => prev + 1);
    }, Math.random() * 400 + 200);

    return () => clearTimeout(timeout);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center font-mono text-xs md:text-sm p-8">
      <div className="w-full max-w-md space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className={`flex items-center space-x-3 ${idx > currentStep ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`w-3 h-3 border border-brand-poly-blue ${step.status === 'done' ? 'bg-brand-poly-blue' : 'animate-pulse'}`}></div>
            <span className={step.status === 'done' ? 'text-white' : 'text-brand-poly-blue'}>{step.msg}</span>
            {step.status === 'done' && <span className="text-brand-kalshi-green ml-auto">[OK]</span>}
          </div>
        ))}
      </div>
      <div className="mt-8 w-full max-w-md bg-brand-fin-border h-1 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-poly-blue"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
