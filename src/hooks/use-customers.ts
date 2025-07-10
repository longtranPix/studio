
'use client';

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { searchCustomers, createCustomer } from '@/api';
import type { CustomerRecord, CreateCustomerPayload } from '@/types/order';

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
    mutationFn: (payload: CreateCustomerPayload): Promise<CustomerRecord> => {
      if (!tableCustomerId) {
        throw new Error('Customer table ID is not configured.');
      }
      return createCustomer({ payload, tableId: tableCustomerId }).then(response => {
        if (response.records && response.records.length > 0) {
          return response.records[0];
        }
        throw new Error('API did not return a created customer record.');
      });
    },
    onSuccess: () => {
        toast({ title: 'Thành công', description: 'Đã tạo khách hàng mới.' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể tạo khách hàng.';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    },
  });
}
