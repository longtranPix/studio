
// src/hooks/use-attributes.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { searchProductLines, searchCatalogTypes, searchCatalogs } from '@/api';
import type { ProductLineRecord, CatalogTypeRecord, CatalogRecord } from '@/types/order';

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
    mutationFn: ({ query, typeId }: { query: string; typeId: string }): Promise<CatalogRecord[]> => {
      if (!tableCatalogId) throw new Error('Catalog table ID is not configured.');
      if (!typeId) return Promise.resolve([]);
      return searchCatalogs({ query, typeId, tableId: tableCatalogId });
    },
  });
}

    