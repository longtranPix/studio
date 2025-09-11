'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getPlanStatus } from '@/api';
import { useEffect } from 'react';

export interface PlanStatusData {
  started_time: string;
  cycle: number;
  time_expired: string;
  status: string;
  credit_value: number;
  name_plan: string;
}

export function usePlanStatus() {
  const { accessToken, setCreditValue } = useAuthStore();

  const query = useQuery({
    queryKey: ['planStatus', accessToken],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token available');
      try {
        return await getPlanStatus();
      } catch (error) {
        console.error('Plan status fetch error:', error);
        throw error;
      }
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    select: (data): PlanStatusData | null => {
      if (data?.status === 'success' && data.data?.fields) {
        return data.data.fields;
      }
      return null;
    },
  });

  // Update credit value in auth store when plan status is loaded
  useEffect(() => {
    if (query.data?.credit_value !== undefined) {
      setCreditValue(query.data.credit_value);
    }
  }, [query.data?.credit_value, setCreditValue]);

  return query;
}
