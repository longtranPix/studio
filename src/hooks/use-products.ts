// src/hooks/use-products.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createProductWithUnits, fetchUnitConversionsByProductId, searchProducts, fetchProducts, fetchAllUnitConversionsByProductIds, fetchTotalProducts } from '@/api';
import { useAuthStore } from '@/store/auth-store';
import type { CreateProductPayload, ProductRecord, UnitConversionRecord, CreateProductResponse, NewlyCreatedProductData } from '@/types/order';

export function useCreateProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload): Promise<CreateProductResponse> => createProductWithUnits(payload),
    onSuccess: (data: CreateProductResponse) => {
        toast({ title: 'Thành công', description: data.detail || "Sản phẩm đã được tạo." });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['totalProducts'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Tạo hàng hóa thất bại.';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

export function useSearchProducts(query: string) {
    const { tableProductId } = useAuthStore();
    return useQuery({
      queryKey: ['searchProducts', query, tableProductId],
      queryFn: async () => {
        if (!tableProductId) throw new Error('Product table ID is not configured.');
        if (!query) return [];
        return searchProducts({ query, tableId: tableProductId });
      },
      enabled: false,
    });
}

export function useFetchUnitConversions(productId: string | null) {
    const { tableUnitConversionsId, isAuthenticated } = useAuthStore();

    return useQuery({
      queryKey: ['unitConversions', productId, tableUnitConversionsId],
      queryFn: (): Promise<UnitConversionRecord[]> => {
        if (!tableUnitConversionsId) {
          throw new Error('Unit conversions table ID is not configured.');
        }
        if (!productId) {
          throw new Error('Product ID is required.');
        }
        return fetchUnitConversionsByProductId({ productId, tableId: tableUnitConversionsId });
      },
      enabled: !!productId && !!tableUnitConversionsId && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
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
