'use client';

import type { Order, OrderDetail } from '@/types/order';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, X, Package, Tag, CircleDollarSign, Percent } from 'lucide-react';

interface OrderDetailsDialogProps {
    selectedOrder: Order | null;
    orderDetails: OrderDetail[] | undefined;
    isLoadingDetails: boolean;
    formatDate: (dateString: string | Date) => string;
    formatCurrency: (value: number) => string;
}

export function OrderDetailsDialog({
    selectedOrder,
    orderDetails,
    isLoadingDetails,
    formatDate,
    formatCurrency
}: OrderDetailsDialogProps) {
    if (!selectedOrder) return null;

    return (
        <DialogContent className="max-w-4xl w-[95%] sm:w-full p-4 sm:p-6">
            <DialogClose className="absolute -top-2 -right-2 z-10 rounded-full bg-background p-1 text-muted-foreground shadow-md transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
            </DialogClose>
            <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl text-primary">Chi tiết Đơn hàng #{selectedOrder.fields.order_number}</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                    Khách hàng: {selectedOrder.fields.customer_name} - Ngày tạo: {formatDate(selectedOrder.createdTime)}
                    {selectedOrder.fields.payment_method && (
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
                                <TableHead className="font-semibold text-sm"><Package className="inline-block mr-1 h-5 w-5" />Tên sản phẩm</TableHead>
                                <TableHead className="text-right font-semibold text-sm"><Tag className="inline-block mr-1 h-5 w-5" />Số lượng</TableHead>
                                <TableHead className="text-right font-semibold text-sm"><CircleDollarSign className="inline-block mr-1 h-5 w-5" />Đơn giá</TableHead>
                                <TableHead className="text-right font-semibold text-sm"><Percent className="inline-block mr-1 h-5 w-5" />VAT</TableHead>
                                <TableHead className="text-right font-semibold text-sm"><CircleDollarSign className="inline-block mr-1 h-5 w-5" />Thành tiền</TableHead>
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
    );
}
