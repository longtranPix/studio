'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, History as HistoryIcon, FileText, Filter, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = invoiceFile.presignedUrl;
    link.download = invoiceFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset the loading state after a few seconds.
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
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
            <div className='p-1'>
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-6 w-32 rounded-md" />
                          <Skeleton className="h-4 w-40 rounded-md" />
                        </div>
                    </CardTitle>
                    <CardDescription className="pt-2">
                        <Skeleton className="h-5 w-48 rounded-md" />
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-sm">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </CardContent>
            </div>
            <CardFooter className="pt-4 justify-end bg-muted/30 rounded-b-xl">
              <Skeleton className="h-9 w-32 rounded-md" />
            </CardFooter>
          </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col text-foreground">
      <header className="sticky top-0 z-20 w-full py-4 px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
              <div className="flex items-center gap-2 sm:gap-4 self-start sm:self-center">
                 <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                   <ArrowLeft className="w-5 h-5" />
                 </Button>
                 <h1 className="text-xl sm:text-3xl font-headline text-primary flex items-center gap-3">
                    <HistoryIcon className="w-6 h-6 sm:w-8 sm:h-8"/> Lịch sử Đơn hàng
                 </h1>
              </div>
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
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto mt-8 px-4">
        {isLoadingOrders ? renderSkeleton() :
         isOrdersError ? (
          <div className="text-center py-16 text-red-500">
            <AlertTriangle className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-xl font-medium">Lỗi tải đơn hàng</h3>
            <p className="mt-2 text-md">Đã có lỗi xảy ra. Vui lòng thử lại sau.</p>
          </div>
        ) : orders.length === 0 && !isFetchingOrders ? (
          <div className="text-center py-16 animate-fade-in-up">
            <FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl sm:text-2xl font-medium">Không có đơn hàng nào</h3>
            <p className="mt-2 text-md text-muted-foreground">
              Không tìm thấy đơn hàng nào phù hợp với bộ lọc của bạn.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
              {orders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  onSelectOrder={setSelectedOrder}
                  onSubmitInvoice={submitInvoice}
                  isSubmittingInvoice={isSubmittingInvoice}
                  submittingOrderId={variables?.id}
                  onDownloadInvoice={handleDownloadInvoice}
                  downloadingOrderId={downloadingOrderId}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              ))}

              <OrderDetailsDialog
                selectedOrder={selectedOrder}
                orderDetails={orderDetails}
                isLoadingDetails={isLoadingDetails}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            </Dialog>
            
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
          </div>
        )}
      </main>
    </div>
  );
}
