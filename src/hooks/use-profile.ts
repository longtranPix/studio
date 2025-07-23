// src/hooks/use-profile.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getProfile, updateProfile } from '@/api';
import type { ProfileData, ProfileApiResponse, UpdateProfilePayload } from '@/types/order';
import { useToast } from './use-toast';

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

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['profile'], data);
      // You can also invalidate to refetch, but setQueryData is faster for the UI
      // queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      const newBusinessName = data.data.business_name;
      // Also update the businessName in the auth store
      useAuthStore.setState({ businessName: newBusinessName });

      toast({
        title: "Thành công",
        description: data.message || "Tên doanh nghiệp đã được cập nhật.",
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể cập nhật thông tin.';
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export type { ProfileData };
