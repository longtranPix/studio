
// src/hooks/use-attributes.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchCatalogs, createCatalog, searchAttributeTypes, searchAttributes, createAttributeType, createAttribute } from '@/api';
import type { CatalogRecord, AttributeTypeRecord, AttributeRecord, CreateAttributePayload, CreateAttributeTypePayload, TeableCreateAttributeResponse, TeableCreateAttributeTypeResponse, CreateCatalogPayload, TeableCreateCatalogResponse } from '@/types/order';

export function useSearchCatalogs() {
  const { tableCatalogId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<CatalogRecord[]> => {
      if (!tableCatalogId) throw new Error('Catalog table ID is not configured.');
      return searchCatalogs({ query, tableId: tableCatalogId });
    },
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
            toast({ title: 'Thành công', description: `Đã tạo catalog "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo catalog.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}


export function useSearchAttributeTypes() {
  const { tableAttributeTypeId } = useAuthStore();
  return useMutation({
    mutationFn: ({ query, catalogId }: { query: string; catalogId: string | null }): Promise<AttributeTypeRecord[]> => {
      if (!tableAttributeTypeId) throw new Error('Attribute Type table ID is not configured.');
      return searchAttributeTypes({ query, catalogId, tableId: tableAttributeTypeId });
    },
  });
}

export function useSearchAttributes() {
  const { tableAttributeId } = useAuthStore();
  return useMutation({
    mutationFn: ({ query, typeId }: { query: string; typeId: string | null }): Promise<AttributeRecord[]> => {
      if (!tableAttributeId) throw new Error('Attribute table ID is not configured.');
      return searchAttributes({ query, typeId, tableId: tableAttributeId });
    },
  });
}

export function useCreateAttributeType() {
    const { toast } = useToast();
    const { tableAttributeTypeId } = useAuthStore();
    return useMutation({
        mutationFn: (payload: CreateAttributeTypePayload): Promise<TeableCreateAttributeTypeResponse> => {
            if (!tableAttributeTypeId) throw new Error('Attribute Type table ID is not configured.');
            return createAttributeType({ payload, tableId: tableAttributeTypeId });
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

export function useCreateAttribute() {
    const { toast } = useToast();
    const { tableAttributeId } = useAuthStore();
    return useMutation({
        mutationFn: (payload: CreateAttributePayload): Promise<TeableCreateAttributeResponse> => {
            if (!tableAttributeId) throw new Error('Attribute table ID is not configured.');
            return createAttribute({ payload, tableId: tableAttributeId });
        },
        onSuccess: (data) => {
            const name = data.records[0]?.fields.value_attribute;
            toast({ title: 'Thành công', description: `Đã tạo giá trị thuộc tính "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo giá trị thuộc tính.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}

    