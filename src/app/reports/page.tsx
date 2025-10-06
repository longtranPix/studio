// src/app/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, DollarSign, Hash, CreditCard, Banknote, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useSalesReport } from '@/hooks/use-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatCurrencyVND } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType; isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

const ChartSkeleton = () => <Skeleton className="h-[350px] w-full rounded-xl" />;

// Function to calculate a "nice" rounded number that's about double the max value
const getNiceMaxValue = (value: number | undefined | null) => {
    if (typeof value !== 'number' || value === 0) return 100000; // A sensible default
    const doubledValue = value * 2;
    const magnitude = Math.pow(10, Math.floor(Math.log10(doubledValue)));
    const mostSignificantDigit = Math.ceil(doubledValue / magnitude);
    return mostSignificantDigit * magnitude;
};

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const { data: reportData, isLoading, isError } = useSalesReport(dateRange);

  const handleQuickSelect = (value: string) => {
    const today = new Date();
    switch (value) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'last7':
        setDateRange({ from: subDays(today, 6), to: today });
        break;
      case 'this_month':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };
  
  const minTotalDay = reportData?.by_days?.length ? reportData.by_days.reduce((min, day) => (day.total < min.total ? day : min), reportData.by_days[0]) : null;
  const rawMaxValue = reportData?.by_days?.length ? Math.max(...reportData.by_days.map(day => day.total)) : 0;
  const yAxisMax = getNiceMaxValue(rawMaxValue);


  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-10 w-full mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Báo cáo doanh số</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                <span>Chọn ngày</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select onValueChange={handleQuickSelect}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Chọn nhanh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hôm nay</SelectItem>
            <SelectItem value="yesterday">Hôm qua</SelectItem>
            <SelectItem value="last7">7 ngày qua</SelectItem>
            <SelectItem value="this_month">Tháng này</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Tổng doanh thu" value={formatCurrencyVND(reportData?.total)} icon={DollarSign} isLoading={isLoading} />
        <StatCard title="Tổng đơn hàng" value={reportData?.count?.toString() ?? '0'} icon={Hash} isLoading={isLoading} />
        <StatCard title="Tiền mặt" value={formatCurrencyVND(reportData?.total_cash)} icon={Banknote} isLoading={isLoading} />
        <StatCard title="Chuyển khoản" value={formatCurrencyVND(reportData?.total_transfer)} icon={CreditCard} isLoading={isLoading} />
         <StatCard title="Doanh thu thấp nhất" value={formatCurrencyVND(minTotalDay?.total)} icon={TrendingDown} isLoading={isLoading} />
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Doanh số đơn hàng hàng ngày</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <ChartSkeleton />
            ) : isError || !reportData ? (
                <div className="h-[350px] flex flex-col items-center justify-center text-destructive">
                    <AlertCircle className="h-10 w-10 mb-4" />
                    <p className="font-semibold">Không thể tải dữ liệu báo cáo.</p>
                    <p className="text-sm">Vui lòng thử lại sau.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={reportData.by_days} margin={{ top: 20, right: 40, left: 0, bottom: 5 }}>
                    <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value, index) => {
                             const totalPoints = reportData.by_days.length;
                             if (totalPoints <= 1) return format(new Date(value), 'dd/MM');
                             if (index === 0 || index === totalPoints - 1 || index === Math.floor(totalPoints / 2)) {
                                 return format(new Date(value), 'dd/MM');
                             }
                             return '';
                         }}
                         tick={{ dy: 10 }}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrencyVND(value)}
                        domain={[0, yAxisMax]}
                        ticks={[yAxisMax]}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        labelFormatter={(label) => format(new Date(label), 'eeee, dd MMMM yyyy', { locale: vi })}
                        formatter={(value: number) => [formatCurrencyVND(value), 'Doanh thu']}
                    />
                    <Legend />
                    {typeof yAxisMax === 'number' && (
                        <ReferenceLine 
                            y={yAxisMax} 
                            stroke="hsl(var(--primary))" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: formatCurrencyVND(yAxisMax), 
                                position: 'insideTopRight',
                                fill: 'hsl(var(--primary))', 
                                fontSize: 12,
                                dx: -10,
                                dy: 10,
                            }}
                        />
                    )}
                    <Line type="monotone" dataKey="total" name="Tổng doanh thu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
