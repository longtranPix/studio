
'use client';

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { searchCustomers, createCustomer } from '@/api';
import type { CustomerRecord, CreateCustomerPayload, TeableCreateCustomerResponse } from '@/types/order';

export function useSearchCustomers() {
  const { tableCustomerId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<CustomerRecord[]> => {
      if (!tableCustomerId) {
        throw new Error('Customer table ID is not configured.');
      }
      return searchCustomers({ query, tableId: tableCustomerId });
    },
  });
}

export function useCreateCustomer() {
  const { toast } = useToast();
  const { tableCustomerId } = useAuthStore();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload): Promise<TeableCreateCustomerResponse> => {
      if (!tableCustomerId) {
        throw new Error('Customer table ID is not configured.');
      }
      return createCustomer({ payload, tableId: tableCustomerId });
    },
    onSuccess: () => {
        toast({ title: 'Thành công', description: 'Đã tạo khách hàng mới.' });
    },
    onError: (error: any) => {
      // Check for specific duplicate error from Teable
      if (error.response?.data?.code === 'validation_error' && error.response?.data?.message?.includes('unique validation failed')) {
        toast({
          title: 'Lỗi',
          description: 'Số điện thoại đã được sử dụng. Vui lòng kiểm tra lại.',
          variant: 'destructive',
        });
      } else {
        const message = error.response?.data?.message || 'Không thể tạo khách hàng.';
        toast({
          title: 'Lỗi',
          description: message,
          variant: 'destructive',
        });
      }
    },
  });
}
