'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePlanStatus } from '@/hooks/use-plan-status';

export default function PlanStatusLoader() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: planStatus } = usePlanStatus();

  // This component doesn't render anything visible, it just loads plan status in the background
  useEffect(() => {
    if (isAuthenticated && planStatus) {
      console.log('Plan status loaded:', planStatus);
    }
  }, [isAuthenticated, planStatus]);

  return null;
}
