
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, History as HistoryIcon, FileText, User, Tag, Calendar, Hash, Package, Percent, CircleDollarSign, Send, Download, ChevronLeft, ChevronRight, Filter, AlertTriangle, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useFetchOrders, useFetchTotalOrders, useFetchOrderDetails, useSubmitInvoice } from '@/hooks/use-orders';
import type { Order, InvoiceFile } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
              {orders.map((order, index) => {
                const invoiceFiles: InvoiceFile[] | undefined = order.fields.invoice_file;
                const hasInvoiceFile = order.fields.invoice_state && invoiceFiles && invoiceFiles.length > 0 && invoiceFiles[0].presignedUrl;
                const isDownloading = downloadingOrderId === order.id;

                return (
                <Card 
                  key={order.id} 
                  className="relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in-up border-border/30"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                >
                    {order.fields.invoice_state && (
                        <div className="absolute top-8 right-[-38px] transform rotate-45 bg-green-500 px-9 py-1 text-center text-white font-semibold text-xs z-10 shadow-md">
                           Đã xuất hoá đơn
                        </div>
                    )}
                    <DialogTrigger asChild onClick={() => setSelectedOrder(order)}>
                        <div className='p-1'>
                            <CardHeader>
                                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                    <div className="flex flex-col">
                                      <span className="flex items-center gap-2 text-primary font-bold text-lg sm:text-xl">
                                          <Hash className="h-5 w-5"/>
                                          {order.fields.order_number ? `${order.fields.order_number}`: '(Chưa lưu)'}
                                      </span>
                                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-1 sm:mt-0">
                                          <Calendar className="h-4 w-4"/>{formatDate(order.createdTime)}
                                      </span>
                                    </div>
                                </CardTitle>
                                <CardDescription className="pt-2 text-sm sm:text-base space-y-1">
                                    <span className="flex items-center gap-2"><User className="h-4 w-4"/>Khách hàng: {order.fields.customer_name}</span>
                                    {order.fields.payment_method && (
                                        <span className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4"/>Thanh toán: {order.fields.payment_method === 'TM' ? 'Tiền mặt' : 'Chuyển khoản'}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-sm">
                              <div className="p-3 sm:p-4 bg-secondary/80 rounded-lg">
                                <p className="text-muted-foreground text-xs sm:text-sm">Tổng trước VAT</p>
                                <p className="font-semibold text-base sm:text-lg">{formatCurrency(order.fields.total_temp)}</p>
                              </div>
                               <div className="p-3 sm:p-4 bg-secondary/80 rounded-lg">
                                <p className="text-muted-foreground text-xs sm:text-sm">Tổng tiền VAT</p>
                                <p className="font-semibold text-base sm:text-lg">{formatCurrency(order.fields.total_vat)}</p>
                              </div>
                               <div className="p-3 sm:p-4 bg-primary/20 rounded-lg">
                                <p className="text-primary font-medium text-xs sm:text-sm">Tổng sau VAT</p>
                                <p className="font-bold text-base sm:text-xl text-primary">{formatCurrency(order.fields.total_after_vat)}</p>
                              </div>
                            </CardContent>
                        </div>
                    </DialogTrigger>
                    
                    {(hasInvoiceFile || !order.fields.invoice_state) && (
                      <CardFooter className="pt-4 justify-end bg-muted/30 rounded-b-xl">
                        {hasInvoiceFile ? (
                           <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                              onClick={(e) => handleDownloadInvoice(e, order)}
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Đang tải
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Tải Hoá Đơn
                                </>
                              )}
                            </Button>
                        ) : (
                          <Button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  submitInvoice(order);
                              }} 
                              disabled={isSubmittingInvoice && variables?.id === order.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                              {(isSubmittingInvoice && variables?.id === order.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                              Xuất hoá đơn
                          </Button>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                )
              })}

              <DialogContent className="max-w-4xl w-[95%] sm:w-full p-4 sm:p-6">
                  <DialogHeader>
                      <DialogTitle className="text-xl sm:text-2xl text-primary">Chi tiết Đơn hàng #{selectedOrder?.fields.order_number}</DialogTitle>
                      <DialogDescription className="text-sm sm:text-base">
                          Khách hàng: {selectedOrder?.fields.customer_name} - Ngày tạo: {selectedOrder ? formatDate(selectedOrder.createdTime) : ''}
                           {selectedOrder?.fields.payment_method && (
                              <>
                                <br />
                                Thanh toán: {selectedOrder.fields.payment_method === 'TM' ? 'Tiền mặt' : 'Chuyển khoản'}
                              </>
                            )}
                      </DialogDescription>
                  </DialogHeader>
                  {isLoadingDetails ? (
                      <div className="flex justify-center items-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                  ) : (
                      <div className="overflow-x-auto mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-sm"><Package className="inline-block mr-1 h-5 w-5"/>Tên sản phẩm</TableHead>
                                    <TableHead className="text-right font-semibold text-sm"><Tag className="inline-block mr-1 h-5 w-5"/>Số lượng</TableHead>
                                    <TableHead className="text-right font-semibold text-sm"><CircleDollarSign className="inline-block mr-1 h-5 w-5"/>Đơn giá</TableHead>
                                    <TableHead className="text-right font-semibold text-sm"><Percent className="inline-block mr-1 h-5 w-5"/>VAT</TableHead>
                                    <TableHead className="text-right font-semibold text-sm"><CircleDollarSign className="inline-block mr-1 h-5 w-5"/>Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderDetails && orderDetails.length > 0 ? orderDetails.map((detail) => (
                                    <TableRow key={detail.id} className="text-sm sm:text-base">
                                        <TableCell className="font-medium">{detail.fields.product_name}</TableCell>
                                        <TableCell className="text-right">{detail.fields.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(detail.fields.unit_price)}</TableCell>
                                        <TableCell className="text-right">{detail.fields.vat}%</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(detail.fields.final_total)}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">Không có chi tiết đơn hàng.</TableCell>
                                  </TableRow>
                                )}
                            </TableBody>
                        </Table>
                      </div>
                  )}
              </DialogContent>
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
