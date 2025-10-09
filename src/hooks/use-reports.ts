// src/hooks/use-reports.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { fetchSalesReport } from '@/api';
import type { SalesReportResponse } from '@/types/order';
import { DateRange } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';

export function useSalesReport(dateRange: DateRange | undefined) {
  const { isAuthenticated } = useAuthStore();
  
  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
  const isSingleDay = dateRange?.from && dateRange?.to ? isSameDay(dateRange.from, dateRange.to) : false;

  return useQuery({
    queryKey: ['salesReport', startDate, endDate],
    queryFn: () => {
        if (!startDate || !endDate) {
            throw new Error('Date range is required to fetch sales report.');
        }
        return fetchSalesReport({ startDate, endDate });
    },
    enabled: !!startDate && !!endDate && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    select: (response: SalesReportResponse) => {
        const { summary, breakdown } = response.data;
        const chartData = Object.entries(breakdown).map(([key, value]) => ({
            key,
            total: value,
        }));
        
        return {
            summary,
            chartData,
            isSingleDay,
        };
    }
  });
}
