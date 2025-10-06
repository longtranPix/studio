// src/hooks/use-reports.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { fetchSalesReport } from '@/api';
import type { SalesReportResponse } from '@/types/order';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export function useSalesReport(dateRange: DateRange | undefined) {
  const { isAuthenticated } = useAuthStore();
  
  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;

  return useQuery<SalesReportResponse, Error>({
    queryKey: ['salesReport', startDate, endDate],
    queryFn: () => {
        if (!startDate || !endDate) {
            throw new Error('Date range is required to fetch sales report.');
        }
        return fetchSalesReport({ startDate, endDate });
    },
    enabled: !!startDate && !!endDate && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });
}
