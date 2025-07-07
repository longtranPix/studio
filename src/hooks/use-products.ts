
'use client';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createProductWithUnits, searchProducts } from '@/api';
import { useAuthStore } from '@/store/auth-store';
import type { CreateProductPayload, ProductRecord } from '@/types/order';

export function useCreateProduct() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductWithUnits(payload),
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Tạo hàng hóa thất bại.';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

export function useSearchProducts() {
    const { tableProductId } = useAuthStore();
    return useMutation({
      mutationFn: (query: string): Promise<ProductRecord[]> => {
        if (!tableProductId) {
          return Promise.reject(new Error('Product table ID is not configured.'));
        }
        if (!query) return Promise.resolve([]);
        return searchProducts({ query, tableId: tableProductId });
      },
    });
}
