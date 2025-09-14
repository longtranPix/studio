'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportSummary } from '@/types/report';
import { 
  ShoppingCart, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Calendar,
  Landmark
} from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: ReportSummary;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function ReportSummaryCards({ summary, isLoading }: ReportSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng số đơn hàng',
      value: summary.total_orders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tổng số tiền tạm tính',
      value: formatCurrency(summary.total_temp),
      icon: Landmark,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tổng VAT',
      value: formatCurrency(summary.total_vat),
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Tổng số tiền có thuế',
      value: formatCurrency(summary.total_with_tax),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground break-words">
                {card.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
