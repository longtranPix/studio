// src/hooks/use-profile.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { getProfile, updateProfile, fetchBanks } from '@/api';
import type { ProfileData, ProfileApiResponse, UpdateProfilePayload, BankInfo } from '@/types/order';
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

export function useUpdateProfile({onSuccess, onError}: {onSuccess?: (data: ProfileApiResponse) => void, onError?: (error: any) => void} = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['profile'], data);
      
      const newBusinessName = data.data.business_name;
      // Also update the businessName in the auth store
      useAuthStore.setState({ businessName: newBusinessName });

      toast({
        title: "Thành công",
        description: data.message || "Thông tin của bạn đã được cập nhật.",
        variant: 'success',
      });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      if (onError) {
        onError(error);
      } else {
        const message = error.response?.data?.detail || 'Không thể cập nhật thông tin.';
        toast({
          title: "Lỗi",
          description: message,
          variant: "destructive",
        });
      }
    },
  });
}

export function useBanks() {
    return useQuery<BankInfo[]>({
        queryKey: ['banks'],
        queryFn: fetchBanks,
        staleTime: Infinity, // This data rarely changes
        gcTime: Infinity,
    });
}


export type { ProfileData };
