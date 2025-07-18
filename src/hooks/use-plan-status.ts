// src/hooks/use-plan-status.ts
'use client';
import { useAuthStore } from '@/store/auth-store';
import { getPlanStatus } from '@/api';

export function usePlanStatus() {
  const { currentPlanId, setCreditValue } = useAuthStore();

  const refetchPlanStatus = async () => {
    if (currentPlanId) {
      try {
        const planStatus = await getPlanStatus(currentPlanId);
        const creditValue = planStatus.data.fields.credit_value;
        setCreditValue(creditValue);
      } catch (error) {
        console.error("Failed to refetch plan status:", error);
        // Optionally, handle the error (e.g., show a toast)
      }
    }
  };

  return { refetchPlanStatus };
}
