// src/hooks/use-brands.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchBrands, createBrand } from '@/api';
import type { BrandRecord, CreateBrandPayload, TeableCreateBrandResponse } from '@/types/order';

export function useSearchBrands() {
  const { tableBrandId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<BrandRecord[]> => {
      if (!tableBrandId) {
        throw new Error('Brand table ID is not configured.');
      }
      return searchBrands({ query, tableId: tableBrandId });
    },
  });
}

export function useCreateBrand() {
    const { toast } = useToast();
    const { tableBrandId } = useAuthStore();
    return useMutation({
      mutationFn: (payload: CreateBrandPayload): Promise<TeableCreateBrandResponse> => {
        if (!tableBrandId) {
          throw new Error('Brand table ID is not configured.');
        }
        return createBrand({ payload, tableId: tableBrandId });
      },
      onSuccess: (data) => {
          const name = data.records[0]?.fields.name;
          toast({ title: 'Thành công', description: `Đã tạo thương hiệu "${name}".` });
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Không thể tạo thương hiệu.';
        toast({
          title: 'Lỗi',
          description: message,
          variant: 'destructive',
        });
      },
    });
}

    
