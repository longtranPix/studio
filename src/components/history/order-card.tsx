
'use client';

import type { Order, InvoiceFile } from '@/types/order';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Send, User, CheckCircle, Eye } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import * as React from 'react';


interface OrderCardProps extends React.HTMLAttributes<HTMLDivElement> {
    order: Order;
    index: number;
    onSubmitInvoice: (order: Order) => void;
    isSubmittingInvoice: boolean;
    submittingOrderId?: string | null;
    onDownloadInvoice: (e: React.MouseEvent<HTMLButtonElement>, order: Order) => void;
    downloadingOrderId: string | null;
    formatDate: (dateString: string | Date) => string;
    formatCurrency: (value: number) => string;
}

export const OrderCard = React.forwardRef<HTMLDivElement, OrderCardProps>(({
    order,
    index,
    onSubmitInvoice,
    isSubmittingInvoice,
    submittingOrderId,
    onDownloadInvoice,
    downloadingOrderId,
    formatDate,
    formatCurrency,
    ...props
}, ref) => {
    const invoiceFiles: InvoiceFile[] | undefined = order.fields.invoice_file;
    const hasInvoiceFile = order.fields.invoice_state && invoiceFiles && invoiceFiles.length > 0 && invoiceFiles[0].presignedUrl;
    const isDownloading = downloadingOrderId === order.id;

    return (
        <div ref={ref} {...props} >
            <Card
                className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer h-full"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
                <div className='p-4 flex-grow'>
                    <CardHeader className="p-0 mb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="flex items-center gap-2 text-primary text-base">
                                    {order.fields.order_number ? `#${order.fields.order_number}` : '(Chưa lưu)'}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {formatDate(order.createdTime)}
                                </CardDescription>
                            </div>
                            {order.fields.invoice_state && (
                               <Badge variant="default" className="bg-green-600 text-white text-xs">
                                   <CheckCircle className="h-3 w-3 mr-1"/> Đã xuất
                               </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="mb-3">
                            <p className="flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-muted-foreground"/>{order.fields.customer_name}</p>
                        </div>

                        <div className="p-3 bg-primary/10 rounded-lg text-center mb-3">
                            <p className="text-primary font-medium text-xs">Tổng cộng</p>
                            <p className="font-bold text-xl text-primary">{formatCurrency(order.fields.total_after_vat)}</p>
                        </div>

                        <Accordion type="single" collapsible onClick={(e) => e.stopPropagation()}>
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs hover:no-underline">
                                    <span>Xem chi tiết giá</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 space-y-1.5">
                                    <div className="flex justify-between items-center text-xs p-1.5 rounded-md bg-secondary/60 dark:bg-secondary/30">
                                        <span className="font-medium">Tổng trước VAT</span>
                                        <Badge variant="secondary">{formatCurrency(order.fields.total_temp)}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs p-1.5 rounded-md bg-secondary/60 dark:bg-secondary/30">
                                        <span className="font-medium">Tổng tiền VAT</span>
                                        <Badge variant="secondary">{formatCurrency(order.fields.total_vat)}</Badge>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </div>
                <CardFooter className="p-2 pt-0 flex flex-col items-stretch gap-2 mt-auto">
                    <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><Eye className="mr-2 h-4 w-4"/>Xem chi tiết</Button>
                    
                    {hasInvoiceFile ? (
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            onClick={(e) => onDownloadInvoice(e, order)}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Tải Hoá Đơn
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
            </Card>
        </div>
    );
});
OrderCard.displayName = 'OrderCard';
