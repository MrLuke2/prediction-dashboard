import { useCallback } from 'react';
import { useUIStore, useNotificationStore } from '../store';

/**
 * Hook to enforce authentication and handle authorization checks.
 */
export const useAuthGuard = () => {
  const jwt = useUIStore(state => state.jwt);
  const user = useUIStore(state => state.user);
  const setAuthOpen = useUIStore(state => state.setAuthOpen);
  const addToast = useNotificationStore(state => state.addToast);

  const requireAuth = useCallback(() => {
    if (!jwt) {
      setAuthOpen(true);
      return false;
    }
    return true;
  }, [jwt, setAuthOpen]);

  const checkPlan = useCallback((requiredPlan: 'pro' | 'enterprise') => {
    if (!requireAuth()) return false;
    
    const plans = ['free', 'pro', 'enterprise'];
    const currentWeight = plans.indexOf(user?.plan || 'free');
    const requiredWeight = plans.indexOf(requiredPlan);

    if (currentWeight < requiredWeight) {
      addToast({
        type: 'warning',
        title: 'Pro Mode Required',
        message: `Plan ${requiredPlan} required for this operation.`
      });
      return false;
    }
    
    return true;
  }, [requireAuth, user?.plan, addToast]);

  return { 
    requireAuth, 
    checkPlan,
    isAuthenticated: !!jwt,
    user 
  };
};
