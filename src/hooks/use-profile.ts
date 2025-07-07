'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getProfileByUsername } from '@/api';

export interface ProfileData {
  username: string;
  package: string;
  last_login: string;
  email: string;
  business_name: string;
}

export interface ProfileRecord {
  fields: ProfileData;
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}

export function useProfile() {
  const username = useAuthStore((state) => state.username);

  const query = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      try {
        return await getProfileByUsername(username!);
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once on failure
    select: (data): ProfileRecord | null => {
      if (data?.records && data.records.length > 0) {
        return data.records[0];
      }
      return null;
    },
  });

  return {
    ...query,
    data: query.data ?? null, // Ensure data is never undefined
  };
}
