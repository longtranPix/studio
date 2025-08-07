
// src/hooks/use-attributes.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchProductLines, searchCatalogTypes, searchCatalogs, createCatalogType, createCatalog } from '@/api';
import type { ProductLineRecord, CatalogTypeRecord, CatalogRecord, CreateCatalogPayload, CreateCatalogTypePayload, TeableCreateCatalogResponse, TeableCreateCatalogTypeResponse } from '@/types/order';

export function useSearchProductLines() {
  const { tableProductLineId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<ProductLineRecord[]> => {
      if (!tableProductLineId) throw new Error('Product Line table ID is not configured.');
      return searchProductLines({ query, tableId: tableProductLineId });
    },
  });
}

export function useSearchCatalogTypes() {
  const { tableCatalogTypeId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<CatalogTypeRecord[]> => {
      if (!tableCatalogTypeId) throw new Error('Catalog Type table ID is not configured.');
      return searchCatalogTypes({ query, tableId: tableCatalogTypeId });
    },
  });
}

export function useSearchCatalogs() {
  const { tableCatalogId } = useAuthStore();
  return useMutation({
    mutationFn: ({ query, typeId }: { query: string; typeId: string | null }): Promise<CatalogRecord[]> => {
      if (!tableCatalogId) throw new Error('Catalog table ID is not configured.');
      return searchCatalogs({ query, typeId, tableId: tableCatalogId });
    },
  });
}

export function useCreateCatalogType() {
    const { toast } = useToast();
    const { tableCatalogTypeId } = useAuthStore();
    return useMutation({
        mutationFn: (payload: CreateCatalogTypePayload): Promise<TeableCreateCatalogTypeResponse> => {
            if (!tableCatalogTypeId) throw new Error('Catalog Type table ID is not configured.');
            return createCatalogType({ payload, tableId: tableCatalogTypeId });
        },
        onSuccess: (data) => {
            const name = data.records[0]?.fields.name;
            toast({ title: 'Thành công', description: `Đã tạo loại thuộc tính "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo loại thuộc tính.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}

export function useCreateCatalog() {
    const { toast } = useToast();
    const { tableCatalogId } = useAuthStore();
    return useMutation({
        mutationFn: (payload: CreateCatalogPayload): Promise<TeableCreateCatalogResponse> => {
            if (!tableCatalogId) throw new Error('Catalog table ID is not configured.');
            return createCatalog({ payload, tableId: tableCatalogId });
        },
        onSuccess: (data) => {
            const name = data.records[0]?.fields.name;
            toast({ title: 'Thành công', description: `Đã tạo giá trị thuộc tính "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo giá trị thuộc tính.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}
