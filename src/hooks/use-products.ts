// src/hooks/use-products.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createProductWithUnits, fetchUnitConversionsByProductId, searchProducts, fetchProducts, fetchAllUnitConversionsByProductIds, fetchTotalProducts } from '@/api';
import { useAuthStore } from '@/store/auth-store';
import type { CreateProductPayload, ProductRecord, UnitConversionRecord } from '@/types/order';

export function useCreateProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductWithUnits(payload),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['totalProducts'] });
    },
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
        return data; 
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

// For Products Page
export function useFetchProducts(page: number, searchTerm: string) {
    const { tableProductId, productViewId, isAuthenticated } = useAuthStore();
    return useQuery({
      queryKey: ['products', tableProductId, productViewId, page, searchTerm],
      queryFn: () => {
        if (!tableProductId || !productViewId) {
            throw new Error("Product table or view ID is not configured.");
        }
        return fetchProducts({ tableId: tableProductId, viewId: productViewId, page, query: searchTerm });
      },
      enabled: !!tableProductId && !!productViewId && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useFetchTotalProducts(searchTerm: string) {
    const { tableProductId, isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['totalProducts', tableProductId, searchTerm],
        queryFn: () => {
            if(!tableProductId) throw new Error("Product table ID not configured");
            return fetchTotalProducts({ tableId: tableProductId, query: searchTerm });
        },
        enabled: !!tableProductId && isAuthenticated,
        staleTime: 1000 * 60 * 5,
    })
}

export function useFetchAllUnitConversionsForProducts(productIds: string[]) {
    const { tableUnitConversionsId, isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['allUnitConversions', productIds],
        queryFn: () => {
            if (!tableUnitConversionsId) {
                throw new Error("Unit conversions table ID is not configured.");
            }
            return fetchAllUnitConversionsByProductIds({ productIds, tableId: tableUnitConversionsId });
        },
        enabled: !!tableUnitConversionsId && isAuthenticated && productIds.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

    