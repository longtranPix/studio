import { useQuery } from '@tanstack/react-query';
import { getOrderReport } from '@/api';
import { OrderReportData, ReportFilters } from '@/types/report';

export const useOrderReport = (filters: ReportFilters) => {
  const startDate = filters.startDate.toISOString();
  const endDate = filters.endDate.toISOString();

  return useQuery({
    queryKey: ['orderReport', startDate, endDate],
    queryFn: () => getOrderReport(startDate, endDate),
    enabled: !!filters.startDate && !!filters.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
