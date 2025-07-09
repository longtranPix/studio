
'use client';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createProductWithUnits, fetchUnitConversionsByProductId, searchProducts } from '@/api';
import { useAuthStore } from '@/store/auth-store';
import type { CreateProductPayload, ProductRecord, UnitConversionRecord } from '@/types/order';

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
      mutationFn: async (query: string): Promise<ProductRecord[]> => {
        if (!tableProductId) {
          throw new Error('Product table ID is not configured.');
        }
        if (!query) return [];
        const data = await searchProducts({ query, tableId: tableProductId });
        return data; // Assuming searchProducts now returns the full object with records
      },
    });
}

export function useFetchUnitConversions() {
    const { tableUnitConversionsId } = useAuthStore();
    const { toast } = useToast();
  
    return useMutation({
      mutationFn: (productId: string): Promise<UnitConversionRecord[]> => {
        if (!tableUnitConversionsId) {
          throw new Error('Unit conversions table ID is not configured.');
        }
        return fetchUnitConversionsByProductId({ productId, tableId: tableUnitConversionsId });
      },
      onError: (error: any) => {
        toast({
          title: 'Lỗi tải đơn vị tính',
          description: error.message || 'Không thể tải danh sách đơn vị tính cho sản phẩm này.',
          variant: 'destructive',
        });
      },
    });
}
