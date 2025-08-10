
// src/hooks/use-attributes.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchProductLines, createProductLine, searchAttributeTypes, searchAttributes, createAttributeType, createAttribute } from '@/api';
import type { ProductLineRecord, AttributeTypeRecord, AttributeRecord, CreateAttributePayload, CreateAttributeTypePayload, TeableCreateAttributeResponse, TeableCreateAttributeTypeResponse, CreateProductLinePayload, TeableCreateProductLineResponse } from '@/types/order';

export function useSearchProductLines() {
  const { tableProductLineId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<ProductLineRecord[]> => {
      if (!tableProductLineId) throw new Error('Product Line table ID is not configured.');
      return searchProductLines({ query, tableId: tableProductLineId });
    },
  });
}

export function useCreateProductLine() {
    const { toast } = useToast();
    const { tableProductLineId } = useAuthStore();
    return useMutation({
        mutationFn: (payload: CreateProductLinePayload): Promise<TeableCreateProductLineResponse> => {
            if (!tableProductLineId) throw new Error('Product Line table ID is not configured.');
            return createProductLine({ payload, tableId: tableProductLineId });
        },
        onSuccess: (data) => {
            const name = data.records[0]?.fields.name;
            toast({ title: 'Thành công', description: `Đã tạo ngành hàng "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo ngành hàng.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}


export function useSearchAttributeTypes() {
  const { tableAttributeTypeId } = useAuthStore();
  return useMutation({
    mutationFn: (query: string): Promise<AttributeTypeRecord[]> => {
      if (!tableAttributeTypeId) throw new Error('Attribute Type table ID is not configured.');
      return searchAttributeTypes({ query, tableId: tableAttributeTypeId });
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
            const name = data.records[0]?.fields.name;
            toast({ title: 'Thành công', description: `Đã tạo giá trị thuộc tính "${name}".` });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể tạo giá trị thuộc tính.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}
