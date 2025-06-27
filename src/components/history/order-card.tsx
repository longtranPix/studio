'use client';

import type { Order, InvoiceFile } from '@/types/order';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Download, Send, Hash, Calendar, User, CreditCard } from 'lucide-react';

interface OrderCardProps {
    order: Order;
    index: number;
    onSelectOrder: (order: Order) => void;
    onSubmitInvoice: (order: Order) => void;
    isSubmittingInvoice: boolean;
    submittingOrderId?: string | null;
    onDownloadInvoice: (e: React.MouseEvent<HTMLButtonElement>, order: Order) => void;
    downloadingOrderId: string | null;
    formatDate: (dateString: string | Date) => string;
    formatCurrency: (value: number) => string;
}

export function OrderCard({
    order,
    index,
    onSelectOrder,
    onSubmitInvoice,
    isSubmittingInvoice,
    submittingOrderId,
    onDownloadInvoice,
    downloadingOrderId,
    formatDate,
    formatCurrency,
}: OrderCardProps) {
    const invoiceFiles: InvoiceFile[] | undefined = order.fields.invoice_file;
    const hasInvoiceFile = order.fields.invoice_state && invoiceFiles && invoiceFiles.length > 0 && invoiceFiles[0].presignedUrl;
    const isDownloading = downloadingOrderId === order.id;

    return (
        <Card
            className="relative overflow-hidden cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-fade-in-up border-border/30"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
        >
            {order.fields.invoice_state && (
                <div className="absolute top-8 right-[-38px] transform rotate-45 bg-green-500 px-9 py-1 text-center text-white font-semibold text-xs z-10 shadow-md">
                    Đã xuất hoá đơn
                </div>
            )}
            <DialogTrigger asChild onClick={() => onSelectOrder(order)}>
                <div className='p-1'>
                    <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 text-primary font-bold text-lg sm:text-xl">
                                    <Hash className="h-5 w-5" />
                                    {order.fields.order_number ? `${order.fields.order_number}` : '(Chưa lưu)'}
                                </span>
                                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-1 sm:mt-0">
                                    <Calendar className="h-4 w-4" />{formatDate(order.createdTime)}
                                </span>
                            </div>
                        </CardTitle>
                        <CardDescription className="pt-2 text-sm sm:text-base space-y-1">
                            <span className="flex items-center gap-2"><User className="h-4 w-4" />Khách hàng: {order.fields.customer_name}</span>
                            {order.fields.payment_method && (
                                <span className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />Thanh toán: {order.fields.payment_method === 'TM' ? 'Tiền mặt' : 'Chuyển khoản'}
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
                            onClick={(e) => onDownloadInvoice(e, order)}
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
                                onSubmitInvoice(order);
                            }}
                            disabled={isSubmittingInvoice && submittingOrderId === order.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                            {(isSubmittingInvoice && submittingOrderId === order.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Xuất hoá đơn
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
