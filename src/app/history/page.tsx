
'use client';

import { useState, useEffect, Fragment } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, History as HistoryIcon, FileText, User, Tag, Calendar, Hash, Package, Percent, CircleDollarSign, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { fetchOrders, fetchOrderDetails, createViettelInvoice, updateOrderRecord } from '@/api';
import type { Order, OrderDetail } from '@/types/order';


export default function HistoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, tableOrderId, tableOrderDetailId, username, _hasHydrated } = useAuthStore();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingOrders,
    isError: isOrdersError,
  } = useInfiniteQuery({
      queryKey: ['orders', tableOrderId],
      queryFn: ({ pageParam }) => fetchOrders({ pageParam, tableId: tableOrderId! }),
      getNextPageParam: (lastPage) => lastPage.offset,
      initialPageParam: null,
      enabled: !!tableOrderId && isAuthenticated,
  });

  const {
      data: orderDetails,
      isLoading: isLoadingDetails
  } = useQuery({
      queryKey: ['orderDetails', selectedOrder?.id, tableOrderDetailId],
      queryFn: () => fetchOrderDetails({ orderId: selectedOrder!.id, tableId: tableOrderDetailId! }),
      enabled: !!selectedOrder && !!tableOrderDetailId,
  });

  const invoiceMutation = useMutation({
    mutationFn: async (order: Order) => {
        if (!username || !tableOrderDetailId || !tableOrderId) throw new Error("Missing user data for invoicing.");
        
        const details = await queryClient.fetchQuery<OrderDetail[]>({
            queryKey: ['invoiceOrderDetails', order.id, tableOrderDetailId],
            queryFn: () => fetchOrderDetails({ orderId: order.id, tableId: tableOrderDetailId }),
        });

        if (!details || details.length === 0) throw new Error("Không tìm thấy chi tiết đơn hàng để xuất hoá đơn.");

        const itemsForApi = details.map((item, index) => {
            const unitPrice = item.fields.unit_price ?? 0;
            const quantity = item.fields.quantity ?? 0;
            const itemTotalAmountWithoutTax = unitPrice * quantity;
            const taxPercentage = item.fields.vat ?? 0;
            const taxAmount = itemTotalAmountWithoutTax * (taxPercentage / 100);
            return { lineNumber: index + 1, itemName: item.fields.product_name, unitName: "Chiếc", unitPrice, quantity, selection: 1, itemTotalAmountWithoutTax, taxPercentage, taxAmount };
        });

        const uniqueVatRates = Array.from(new Set(details.map(item => item.fields.vat).filter(vat => vat !== null && vat > 0) as number[]));
        const taxBreakdowns = uniqueVatRates.length > 0 ? uniqueVatRates.map(rate => ({ taxPercentage: rate })) : [{ taxPercentage: 0 }];

        const payload = {
            generalInvoiceInfo: { invoiceType: "01GTKT", templateCode: "1/772", invoiceSeries: "C25MMV", currencyCode: "VND", adjustmentType: "1", paymentStatus: true, cusGetInvoiceRight: true },
            buyerInfo: { buyerName: order.fields.customer_name },
            payments: [{ paymentMethodName: "CK" }],
            taxBreakdowns, itemInfo: itemsForApi
        };

        const { invoiceNo } = await createViettelInvoice({ username, payload });
        await updateOrderRecord({ orderId: order.id, tableId: tableOrderId, payload: { order_number: invoiceNo, invoice_state: true } });
        return invoiceNo;
    },
    onSuccess: () => {
        toast({ title: 'Thành công', description: 'Hoá đơn đã được xuất và đơn hàng đã được cập nhật.' });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
        const errorMessage = error.response?.data?.message || error.response?.data?.error_message || error.message || 'Không thể gửi hóa đơn.';
        toast({ title: 'Lỗi Xuất Hóa Đơn', description: errorMessage, variant: 'destructive', duration: 7000 });
    }
  });
  
  const orders = ordersData?.pages.flatMap(page => page.records) ?? [];

  const formatCurrency = (value: number) => {
      if (typeof value !== 'number') return 'N/A';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('vi-VN');
  }

  if (isLoadingOrders || !_hasHydrated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Đang tải lịch sử đơn hàng...</p>
        </div>
    );
  }
  
  if (isOrdersError) {
      return <div>Error loading orders.</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full py-3 px-4 sm:px-6 lg:px-8 bg-background/90 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                   <ArrowLeft className="w-5 h-5" />
                 </Button>
                 <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary flex items-center gap-2">
                    <HistoryIcon/> Lịch sử Đơn hàng
                 </h1>
              </div>
          </div>
      </header>

      <main className="flex-grow w-full max-w-4xl mx-auto mt-8 px-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-medium">Không có đơn hàng nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bạn chưa tạo đơn hàng nào. Hãy quay về trang chủ để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
              {orders.map((order) => (
                <Card key={order.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
                    <DialogTrigger asChild onClick={() => setSelectedOrder(order)}>
                        <div>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start flex-wrap gap-y-2">
                                    <span className="flex items-center gap-2">
                                        <Hash className="h-5 w-5 text-primary"/>
                                        Hoá đơn {order.fields.order_number ? `#${order.fields.order_number}`: '(Chưa xuất)'}
                                    </span>
                                    <span className="text-sm font-normal text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>{formatDate(order.fields.createdTime)}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2"><User className="h-4 w-4"/>Khách hàng: {order.fields.customer_name}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="p-3 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">Tổng trước VAT</p>
                                <p className="font-semibold text-lg">{formatCurrency(order.fields.total_temp)}</p>
                              </div>
                               <div className="p-3 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">Tổng tiền VAT</p>
                                <p className="font-semibold text-lg">{formatCurrency(order.fields.total_vat)}</p>
                              </div>
                               <div className="p-3 bg-primary/10 rounded-md">
                                <p className="text-primary font-medium">Tổng sau VAT</p>
                                <p className="font-bold text-xl text-primary">{formatCurrency(order.fields.total_after_vat)}</p>
                              </div>
                            </CardContent>
                        </div>
                    </DialogTrigger>
                    {!order.fields.invoice_state && (
                      <CardFooter className="pt-4 justify-end">
                          <Button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  invoiceMutation.mutate(order);
                              }} 
                              disabled={invoiceMutation.isPending && invoiceMutation.variables?.id === order.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                          >
                              {(invoiceMutation.isPending && invoiceMutation.variables?.id === order.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                              Xuất hoá đơn
                          </Button>
                      </CardFooter>
                    )}
                  </Card>
              ))}

              <DialogContent className="max-w-4xl">
                  <DialogHeader>
                      <DialogTitle>Chi tiết Đơn hàng #{selectedOrder?.fields.order_number}</DialogTitle>
                      <DialogDescription>
                          Khách hàng: {selectedOrder?.fields.customer_name} - Ngày tạo: {selectedOrder ? formatDate(selectedOrder.fields.createdTime) : ''}
                      </DialogDescription>
                  </DialogHeader>
                  {isLoadingDetails ? (
                      <div className="flex justify-center items-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Package className="inline-block mr-1 h-4 w-4"/>Tên sản phẩm</TableHead>
                                    <TableHead className="text-right"><Tag className="inline-block mr-1 h-4 w-4"/>Số lượng</TableHead>
                                    <TableHead className="text-right"><CircleDollarSign className="inline-block mr-1 h-4 w-4"/>Đơn giá</TableHead>
                                    <TableHead className="text-right"><Percent className="inline-block mr-1 h-4 w-4"/>VAT</TableHead>
                                    <TableHead className="text-right"><CircleDollarSign className="inline-block mr-1 h-4 w-4"/>Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderDetails && orderDetails.length > 0 ? orderDetails.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell className="font-medium">{detail.fields.product_name}</TableCell>
                                        <TableCell className="text-right">{detail.fields.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(detail.fields.unit_price)}</TableCell>
                                        <TableCell className="text-right">{detail.fields.vat}%</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(detail.fields.final_total)}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">Không có chi tiết đơn hàng.</TableCell>
                                  </TableRow>
                                )}
                            </TableBody>
                        </Table>
                      </div>
                  )}
              </DialogContent>
            </Dialog>

            {hasNextPage && (
              <div className="text-center mt-8">
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Tải thêm
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

       <footer className="w-full text-center text-sm text-muted-foreground py-6 mt-12">
        <p>&copy; {new Date().getFullYear()} VocalNote. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
