'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breakdown, ReportSummary } from '@/types/report';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, ReferenceLine } from "recharts";

interface ReportChartProps {
  breakdown: Breakdown;
  summary: ReportSummary;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}tr`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
};

const formatDate = (dateString: string) => {
  if (dateString.includes('h')) return dateString;
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

const formatFullDate = (dateString: string) => {
    if (dateString.includes('h')) return `Giờ: ${dateString}`;
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function ReportChart({ breakdown, summary, isLoading }: ReportChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg animate-pulse flex items-center justify-center border border-gray-200">
            <div className="text-gray-500 font-medium">Đang tải biểu đồ...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convert daily breakdown to chart data
  const chartData = Object.entries(breakdown)
    .map(([key, value]) => ({
      date: key.includes('h') ? key : formatDate(key),
      fullDate: key,
      value: value,
    }))
    .sort((a, b) => {
        if(a.fullDate.includes('h') && b.fullDate.includes('h')){
            return parseInt(a.fullDate) - parseInt(b.fullDate);
        }
        return new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    });

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-500">
              <p className="text-lg font-semibold mb-2">Không có dữ liệu</p>
              <p className="text-sm">Không có đơn hàng nào trong khoảng thời gian đã chọn</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    value: {
      label: "Tổng doanh thu",
      color: "#3b82f6",
    },
  } satisfies ChartConfig;

  const actualMaxValue = summary.max_total_day;

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={chartConfig}
          className="h-96 w-full bg-white rounded-lg"
        >
          <LineChart
            data={chartData}
            margin={{
              top: 30,
              right: 100,
              left: 40,
              bottom: 40,
            }}
            className="touch-manipulation"
            onMouseMove={(data) => {
              if (data && data.activeTooltipIndex !== undefined) {
                setActiveIndex(data.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              fontSize={13}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280', fontWeight: 500 }}
              tickMargin={10}
            />
            {activeIndex !== null && (
              <ReferenceLine 
                x={chartData[activeIndex]?.date} 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                strokeWidth={2}
                strokeOpacity={0.6}
              />
            )}
            <ReferenceLine 
              y={actualMaxValue} 
              stroke="#e5e7eb" 
              strokeDasharray="4 4"
              strokeWidth={1}
              strokeOpacity={0.8}
              label={{ 
                value: formatCurrency(actualMaxValue), 
                position: "insideTopRight",
                offset: -10,
                style: { 
                  fill: '#374151', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  textAnchor: 'start'
                }
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-white border border-gray-200 shadow-lg rounded-lg p-3"
                  labelClassName="text-gray-900 font-semibold text-sm mb-1"
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return formatFullDate(payload[0].payload.fullDate);
                    }
                    return value;
                  }}
                  formatter={(value) => [<span className="font-semibold text-blue-400">Tổng doanh thu:</span>, new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value as number)]}
                />
              }
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.6 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 8, 
                stroke: '#ffffff', 
                strokeWidth: 3,
                fill: '#3b82f6',
                style: { 
                  filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))',
                  cursor: 'pointer'
                }
              }}
              connectNulls={true}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.1))' }}
            />
          </LineChart>
        </ChartContainer>
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Tổng doanh thu</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
