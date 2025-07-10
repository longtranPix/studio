// src/hooks/use-suppliers.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { searchSuppliers } from '@/api';
import type { SupplierRecord } from '@/types/order';

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
