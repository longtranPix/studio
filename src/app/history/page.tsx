
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, History as HistoryIcon, FileText, User, Tag, Calendar, Hash, Package, Percent, CircleDollarSign } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Interfaces for type safety
interface Order {
  id: string;
  fields: {
    invoice_code: number;
    customer_name: string;
    total_temp: number;
    total_vat: number;
    total_after_vat: number;
    createdTime: string;
  };
}

interface OrderDetail {
  id: string;
  fields: {
    product_name: string;
    unit_price: number;
    quantity: number;
    vat: number;
    temp_total: number;
    final_total: number;
  };
}

const TEABLE_AUTH_TOKEN = process.env.NEXT_PUBLIC_TEABLE_AUTH_TOKEN;
const TEABLE_BASE_URL = process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL;
const ORDER_TABLE_ID = process.env.NEXT_PUBLIC_TEABLE_ORDER_TABLE_ID;
const ORDER_DETAIL_TABLE_ID = process.env.NEXT_PUBLIC_TEABLE_ORDER_DETAIL_TABLE_ID;

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [offset, setOffset] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn !== 'true') {
      router.push('/auth');
    }
  }, [router]);

  const fetchOrders = useCallback(async (currentOffset: string | null) => {
      if (!hasMore && currentOffset !== null) return;
      
      currentOffset === null ? setIsLoading(true) : setIsLoadingMore(true);

      try {
          const params = new URLSearchParams({
              fieldKeyType: 'dbFieldName',
              take: '10',
          });
          if (currentOffset) {
              params.append('offset', currentOffset);
          }

          const response = await axios.get(
              `${TEABLE_BASE_URL}/${ORDER_TABLE_ID}/record`,
              {
                  headers: {
                      'Authorization': `Bearer ${TEABLE_AUTH_TOKEN}`,
                      'Accept': 'application/json',
                  },
                  params: params
              }
          );
          
          const newOrders = response.data.records || [];
          setOrders(prev => currentOffset ? [...prev, ...newOrders] : newOrders);
          
          const newOffset = response.data.offset;
          setOffset(newOffset || null);
          setHasMore(!!newOffset);

      } catch (error) {
          console.error("Failed to fetch orders:", error);
          toast({
              title: "Lỗi",
              description: "Không thể tải lịch sử đơn hàng. Vui lòng thử lại.",
              variant: "destructive",
          });
      } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
      }
  }, [toast, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchOrders(null);
  }, [fetchOrders]);


  const handleLoadMore = () => {
      if (offset) {
          fetchOrders(offset);
      }
  };

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    setOrderDetails([]);
    setIsLoadingDetails(true);

    try {
        const filter = {
            conjunction: "and",
            filterSet: [{ fieldId: "Don_Hang", operator: "is", value: order.id }]
        };
        
        const response = await axios.get(`${TEABLE_BASE_URL}/${ORDER_DETAIL_TABLE_ID}/record`, {
            params: {
                fieldKeyType: 'dbFieldName',
                filter: JSON.stringify(filter),
            },
            headers: {
                'Authorization': `Bearer ${TEABLE_AUTH_TOKEN}`,
                'Accept': 'application/json',
            },
        });
        
        setOrderDetails(response.data.records || []);
    } catch (error) {
        console.error("Failed to fetch order details:", error);
        toast({
            title: "Lỗi",
            description: "Không thể tải chi tiết đơn hàng.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingDetails(false);
    }
  };

  const formatCurrency = (value: number) => {
      if (typeof value !== 'number') return 'N/A';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('vi-VN');
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Đang tải lịch sử đơn hàng...</p>
        </div>
    );
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
            <Dialog>
              {orders.map((order) => (
                <DialogTrigger asChild key={order.id} onClick={() => handleOrderClick(order)}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start flex-wrap gap-y-2">
                            <span className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary"/>Mã Hóa Đơn #{order.fields.invoice_code}</span>
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
                  </Card>
                </DialogTrigger>
              ))}

              <DialogContent className="max-w-4xl">
                  <DialogHeader>
                      <DialogTitle>Chi tiết Đơn hàng #{selectedOrder?.fields.invoice_code}</DialogTitle>
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
                                {orderDetails.length > 0 ? orderDetails.map((detail) => (
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

            {hasMore && (
              <div className="text-center mt-8">
                <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
