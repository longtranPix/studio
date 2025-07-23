// src/hooks/use-profile.ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getProfile } from '@/api';
import type { ProfileData, ProfileApiResponse } from '@/types/order';


export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  const query = useQuery<ProfileApiResponse, Error, ProfileData | null>({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    select: (response): ProfileData | null => {
      if (response && response.status === 'success') {
        return response.data;
      }
      return null;
    },
  });

  return {
    ...query,
    data: query.data ?? null, // Ensure data is never undefined
  };
}

export type { ProfileData };