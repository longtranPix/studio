
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTutorial } from '@/components/docs/order-tutorial';
import { ReportTutorial } from '@/components/docs/report-tutorial';
import { BookOpen } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hướng dẫn sử dụng</h1>
          <p className="text-muted-foreground mt-1">
            Tìm hiểu cách sử dụng các tính năng chính của Nola.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="create-order" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
              <TabsTrigger value="create-order" className="py-2.5 text-sm sm:text-base">
                Quy trình tạo đơn hàng
              </TabsTrigger>
              <TabsTrigger value="view-report" className="py-2.5 text-sm sm:text-base">
                Xem và lọc báo cáo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create-order" className="mt-6">
              <OrderTutorial />
            </TabsContent>
            <TabsContent value="view-report" className="mt-6">
              <ReportTutorial />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
