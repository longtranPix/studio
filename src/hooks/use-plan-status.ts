
// src/hooks/use-plan-status.ts
'use client';
import { useAuthStore } from '@/store/auth-store';
import { getPlanStatus } from '@/api';

export function usePlanStatus() {
  const { currentPlanId, setCreditValue, setPlanStatus } = useAuthStore();

  const refetchPlanStatus = async () => {
    if (currentPlanId) {
      try {
        const planStatus = await getPlanStatus(currentPlanId);
        const planFields = planStatus.data.fields;
        setCreditValue(planFields.credit_value);
        setPlanStatus(planFields.status as 'active' | 'inactive');
      } catch (error) {
        console.error("Failed to refetch plan status:", error);
        // Optionally, handle the error (e.g., show a toast)
      }
    }
  };

  return { refetchPlanStatus };
}

    