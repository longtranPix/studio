
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
    mutationFn: (payload: { fullname: string; phone_number: string }): Promise<{ record: CustomerRecord }> => {
      if (!tableCustomerId) {
        throw new Error('Customer table ID is not configured.');
      }
      const completePayload: CreateCustomerPayload = {
        ...payload,
        table_customer_id: tableCustomerId,
      };
      return createCustomer(completePayload);
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
