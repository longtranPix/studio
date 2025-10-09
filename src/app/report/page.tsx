'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportSummaryCards } from '@/components/report/report-summary-cards';
import { ReportChart } from '@/components/report/report-chart';
import { DateRangePicker } from '@/components/report/date-range-picker';
import { ReportSkeleton } from '@/components/report/report-skeleton';
import { useOrderReport } from '@/hooks/use-report';
import { ReportFilters } from '@/types/report';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

export default function ReportPage() {
  // Default to today
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const today = new Date();
    return { startDate: today, endDate: today };
  });

  const { data: reportData, isLoading, error, refetch } = useOrderReport(filters);

  const handleDateChange = (startDate: Date, endDate: Date) => {
    setFilters({ startDate, endDate });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tổng quan báo cáo</h1>
          <p className="text-muted-foreground mt-1">
            Phân tích doanh số và đơn hàng theo thời gian
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bộ lọc báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onDateChange={handleDateChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {reportData?.data && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Tổng quan báo cáo</h2>
          <ReportSummaryCards 
            summary={reportData.data.summary} 
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Chart */}
      {reportData?.data && (
        <div className="space-y-4">
          <ReportChart 
            breakdown={reportData.data.breakdown} 
            summary={reportData.data.summary}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && !reportData && <ReportSkeleton />}

      {/* Empty State */}
      {!isLoading && !error && !reportData?.data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Chưa có dữ liệu báo cáo
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Vui lòng chọn khoảng thời gian để xem báo cáo doanh số và đơn hàng.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
