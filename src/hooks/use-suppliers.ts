// src/hooks/use-suppliers.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchSuppliers, createSupplier } from '@/api';
import type { SupplierRecord, CreateSupplierPayload, TeableCreateSupplierResponse } from '@/types/order';

export function useSearchSuppliers() {
  const { tableSupplierId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<SupplierRecord[]> => {
      if (!tableSupplierId) {
        throw new Error('Supplier table ID is not configured.');
      }
      return searchSuppliers({ query, tableId: tableSupplierId });
    },
  });
}

export function useCreateSupplier() {
    const { toast } = useToast();
    const { tableSupplierId } = useAuthStore();
    return useMutation({
      mutationFn: (payload: CreateSupplierPayload): Promise<TeableCreateSupplierResponse> => {
        if (!tableSupplierId) {
          throw new Error('Supplier table ID is not configured.');
        }
        return createSupplier({ payload, tableId: tableSupplierId });
      },
      onSuccess: () => {
          toast({ title: 'Thành công', description: 'Đã tạo nhà cung cấp mới.' });
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Không thể tạo nhà cung cấp.';
        toast({
          title: 'Lỗi',
          description: message,
          variant: 'destructive',
        });
      },
    });
}
