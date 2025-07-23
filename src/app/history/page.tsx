
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, FileText, Filter, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useFetchOrders, useFetchTotalOrders, useFetchOrderDetails, useSubmitInvoice } from '@/hooks/use-orders';
import type { Order } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderCard } from '@/components/history/order-card';
import { OrderDetailsDialog } from '@/components/history/order-details-dialog';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceStateFilter, setInvoiceStateFilter] = useState<string>('all');
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const parsedFilter = useMemo(() => {
    if (invoiceStateFilter === 'true') return true;
    if (invoiceStateFilter === 'false') return false;
    return null;
  }, [invoiceStateFilter]);

  const {
    data: ordersData,
    isLoading: isLoadingPageOrders,
    isFetching: isFetchingOrders,
    isError: isOrdersError,
  } = useFetchOrders(currentPage, parsedFilter);
  
  const { data: totalRecords, isLoading: isLoadingTotal } = useFetchTotalOrders(parsedFilter);
  
  const isLoadingOrders = (isLoadingPageOrders || isLoadingTotal) && !ordersData;
  const orders = ordersData ?? [];
  const totalPages = totalRecords ? Math.ceil(totalRecords / 10) : 1;

  const {
      data: orderDetails,
      isLoading: isLoadingDetails
  } = useFetchOrderDetails(selectedOrder?.id ?? null);

  const { mutate: submitInvoice, isPending: isSubmittingInvoice, variables } = useSubmitInvoice();
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (value: string) => {
    setInvoiceStateFilter(value);
    setCurrentPage(1);
  };
  
  const handleDownloadInvoice = (e: React.MouseEvent<HTMLButtonElement>, order: Order) => {
    e.stopPropagation();
    const invoiceFile = order.fields.invoice_file?.[0];
    if (!invoiceFile?.presignedUrl) return;

    setDownloadingOrderId(order.id);

    const link = document.createElement('a');
    link.href = invoiceFile.presignedUrl;
    link.download = invoiceFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingOrderId(null);
    }, 3000);
  };

  const formatCurrency = (value: number) => {
      if (typeof value !== 'number') return 'N/A';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  const formatDate = (dateString: string | Date) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
  }

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 mt-2 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4 rounded-md" />
            <div className="space-y-3">
               <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-32 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col text-foreground p-4 sm:p-6 lg:p-8">
      <div className="w-full mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary self-start sm:self-center">
                Lịch sử Đơn hàng
            </h1>
            <div className="w-full sm:w-56">
              <Select value={invoiceStateFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="text-sm h-10">
                      <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Lọc theo trạng thái..." />
                      </div>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="true">Đã xuất hoá đơn</SelectItem>
                      <SelectItem value="false">Chưa xuất hoá đơn</SelectItem>
                  </SelectContent>
              </Select>
            </div>
        </div>
      
        <main className="flex-grow w-full">
          {isLoadingOrders ? renderSkeleton() :
          isOrdersError ? (
            <div className="text-center py-16 text-red-500">
              <AlertTriangle className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg sm:text-xl font-medium">Lỗi tải đơn hàng</h3>
              <p className="mt-2 text-sm sm:text-base">Đã có lỗi xảy ra. Vui lòng thử lại sau.</p>
            </div>
          ) : orders.length === 0 && !isFetchingOrders ? (
            <div className="text-center py-16 animate-fade-in-up">
              <FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg sm:text-2xl font-medium">Không có đơn hàng nào</h3>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Không tìm thấy đơn hàng nào phù hợp với bộ lọc của bạn.
              </p>
            </div>
          ) : (
            <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {orders.map((order, index) => (
                  <DialogTrigger asChild key={order.id} onClick={() => setSelectedOrder(order)}>
                    <OrderCard
                      order={order}
                      index={index}
                      onSubmitInvoice={submitInvoice}
                      isSubmittingInvoice={isSubmittingInvoice}
                      submittingOrderId={variables?.id}
                      onDownloadInvoice={handleDownloadInvoice}
                      downloadingOrderId={downloadingOrderId}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </DialogTrigger>
                ))}

                <OrderDetailsDialog
                  selectedOrder={selectedOrder}
                  orderDetails={orderDetails}
                  isLoadingDetails={isLoadingDetails}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isFetchingOrders}
                        variant="outline"
                    >
                        {isFetchingOrders && currentPage === currentPage-1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ChevronLeft className="mr-2 h-4 w-4" />}
                        Trước
                    </Button>
                    <span className="text-sm font-medium">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isFetchingOrders}
                        variant="outline"
                    >
                        Sau
                        {isFetchingOrders && currentPage === currentPage+1 ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
              )}
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}
