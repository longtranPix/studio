'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { fetchBanks, getCurrentUser, updateUserProfile } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { BankInfo } from '@/types/profile';

export interface ProfileData {
  username: string;
  business_name: string;
  current_plan_name: string;
  last_login: string;
  time_expired: string;
  tax_code?: string;
  bank_name?: string;
  bank_number?: string;
  account_name?: string;
}

export interface ProfileResponse {
  status: string;
  data: ProfileData;
}

export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  const query = useQuery<ProfileResponse, Error, ProfileData | null>({
    queryKey: ['profile'],
    queryFn: getCurrentUser,
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (profileData: {
      business_name?: string;
      tax_code?: string;
      bank_name?: string;
      bank_number?: string;
      account_name?: string;
    }) => {
      if (!accessToken) throw new Error('No access token available');
      return updateUserProfile(profileData);
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Thành công', 
        description: data.message || 'Cập nhật thông tin thành công',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật thông tin';
      toast({ 
        title: 'Lỗi', 
        description: errorMessage, 
        variant: 'destructive' 
      });
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
