import { useCallback } from 'react';
import { useUIStore } from '../store';

/**
 * Hook to enforce authentication and handle authorization checks.
 */
export const useAuthGuard = () => {
  const jwt = useUIStore(state => state.jwt);
  const user = useUIStore(state => state.user);
  const setAuthOpen = useUIStore(state => state.setAuthOpen);

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
      // Logic for upgrade prompt would go here
      console.warn(`[AuthGuard] Access denied. Plan ${requiredPlan} required.`);
      return false;
    }
    
    return true;
  }, [requireAuth, user?.plan]);

  return { 
    requireAuth, 
    checkPlan,
    isAuthenticated: !!jwt,
    user 
  };
};
