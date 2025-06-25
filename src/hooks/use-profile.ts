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

  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUsername(username!),
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data): ProfileRecord | null => {
      if (data?.records && data.records.length > 0) {
        return data.records[0];
      }
      return null;
    },
  });
}
