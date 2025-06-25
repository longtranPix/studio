
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, History as HistoryIcon, FileText, User, Tag, Calendar, Hash, Package, Percent, CircleDollarSign, Send, BadgeCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useFetchOrders, useFetchOrderDetails, useSubmitInvoice } from '@/hooks/use-orders';
import type { Order } from '@/types/order';


export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  
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
  } = useFetchOrders();

  const {
      data: orderDetails,
      isLoading: isLoadingDetails
  } = useFetchOrderDetails(selectedOrder?.id ?? null);

  const { mutate: submitInvoice, isPending: isSubmittingInvoice, variables } = useSubmitInvoice();
  
  const orders = ordersData?.pages.flatMap(page => page.records) ?? [];

  const formatCurrency = (value: number) => {
      if (typeof value !== 'number') return 'N/A';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  const formatDate = (dateString: string | Date) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
  }

  if (isLoadingOrders || !_hasHydrated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Đang tải lịch sử đơn hàng...</p>
        </div>
    );
  }
  
  if (isOrdersError) {
      return <div>Lỗi tải đơn hàng.</div>
  }

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <header className="sticky top-0 z-20 w-full py-4 px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-2 sm:gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                   <ArrowLeft className="w-5 h-5" />
                 </Button>
                 <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary flex items-center gap-3">
                    <HistoryIcon className="w-8 h-8"/> Lịch sử Đơn hàng
                 </h1>
              </div>
          </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto mt-8 px-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 animate-fade-in-up">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-medium">Không có đơn hàng nào</h3>
            <p className="mt-2 text-md text-muted-foreground">
              Bạn chưa tạo đơn hàng nào. Hãy quay về trang chủ để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
              {orders.map((order, index) => (
                <Card 
                  key={order.id} 
                  className="relative cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in-up border-border/30"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                >
                    {order.fields.invoice_state && (
                        <div className="absolute top-0 right-0 p-2 z-10" title="Đã xuất hoá đơn">
                           <BadgeCheck className="h-7 w-7 text-green-500" />
                        </div>
                    )}
                    <DialogTrigger asChild onClick={() => setSelectedOrder(order)}>
                        <div className='p-1'>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start flex-wrap gap-y-2">
                                    <span className="flex items-center gap-2 text-primary font-bold text-xl">
                                        <Hash className="h-5 w-5"/>
                                        Hoá đơn {order.fields.order_number ? `#${order.fields.order_number}`: '(Chưa lưu)'}
                                    </span>
                                    <span className="text-sm font-normal text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>{formatDate(order.createdTime)}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2 text-base"><User className="h-4 w-4"/>Khách hàng: {order.fields.customer_name}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="p-4 bg-secondary/80 rounded-lg">
                                <p className="text-muted-foreground">Tổng trước VAT</p>
                                <p className="font-semibold text-lg">{formatCurrency(order.fields.total_temp)}</p>
                              </div>
                               <div className="p-4 bg-secondary/80 rounded-lg">
                                <p className="text-muted-foreground">Tổng tiền VAT</p>
                                <p className="font-semibold text-lg">{formatCurrency(order.fields.total_vat)}</p>
                              </div>
                               <div className="p-4 bg-primary/20 rounded-lg">
                                <p className="text-primary font-medium">Tổng sau VAT</p>
                                <p className="font-bold text-xl text-primary">{formatCurrency(order.fields.total_after_vat)}</p>
                              </div>
                            </CardContent>
                        </div>
                    </DialogTrigger>
                    {!order.fields.invoice_state && (
                      <CardFooter className="pt-4 justify-end bg-muted/30 rounded-b-xl">
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
                      </CardFooter>
                    )}
                  </Card>
              ))}

              <DialogContent className="max-w-4xl p-8">
                  <DialogHeader>
                      <DialogTitle className="text-2xl text-primary">Chi tiết Đơn hàng #{selectedOrder?.fields.order_number}</DialogTitle>
                      <DialogDescription className="text-base">
                          Khách hàng: {selectedOrder?.fields.customer_name} - Ngày tạo: {selectedOrder ? formatDate(selectedOrder.createdTime) : ''}
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
                                    <TableHead className="text-lg"><Package className="inline-block mr-1 h-5 w-5"/>Tên sản phẩm</TableHead>
                                    <TableHead className="text-right text-lg"><Tag className="inline-block mr-1 h-5 w-5"/>Số lượng</TableHead>
                                    <TableHead className="text-right text-lg"><CircleDollarSign className="inline-block mr-1 h-5 w-5"/>Đơn giá</TableHead>
                                    <TableHead className="text-right text-lg"><Percent className="inline-block mr-1 h-5 w-5"/>VAT</TableHead>
                                    <TableHead className="text-right text-lg"><CircleDollarSign className="inline-block mr-1 h-5 w-5"/>Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderDetails && orderDetails.length > 0 ? orderDetails.map((detail) => (
                                    <TableRow key={detail.id} className="text-base">
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
        <p>&copy; {new Date().getFullYear()} Voice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
