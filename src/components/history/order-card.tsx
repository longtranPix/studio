
'use client';

import type { Order, InvoiceFile } from '@/types/order';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Send, User, CheckCircle, Eye, Calendar, TrendingUp, Landmark, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { QRCodeDialog } from '@/components/shared/qr-code-dialog';
import type { ProfileData } from '@/hooks/use-profile';
import { getBankCode } from '@/lib/bank-utils';


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
    profile?: ProfileData | null;
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
    profile,
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
                <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <CardTitle className="text-lg font-bold text-primary">
                            #{order.fields.order_code || '(Chưa lưu)'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {/* QR Code button for bank payments */}
                            {order.fields.payment_method === "Chuyển khoản" && profile?.bank_number && profile?.bank_name && getBankCode(profile.bank_name) && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <QRCodeDialog
                                        bankId={getBankCode(profile.bank_name) || ''}
                                        accountNo={profile.bank_number}
                                        accountName={profile.account_name || profile.business_name || 'N/A'}
                                        amount={order.fields.total_with_tax}
                                        orderCode={order.fields.order_code || 'N/A'}
                                        bankName={profile.bank_name}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 font-semibold h-8 w-8 p-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <QrCode className="h-5 w-5" />
                                        </Button>
                                    </QRCodeDialog>
                                </div>
                            )}
                            {order.fields.invoice_state && (
                                <Badge variant="default" className="bg-green-100 text-green-800 border border-green-200 text-xs dark:bg-green-900/50 dark:text-green-200 dark:border-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Đã xuất
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-foreground">{order.fields.customer_name || 'Khách hàng không tên'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">{formatDate(order.createdTime)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-sm"><Landmark className="h-3.5 w-3.5" />Tổng tạm tính</span>
                        <span className="font-medium text-foreground">{formatCurrency(order.fields.total_temp)}</span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-sm"><TrendingUp className="h-3.5 w-3.5" />Tiền thuế GTGT</span>
                        <span className="font-medium text-foreground">{formatCurrency(order.fields.total_vat_price)}</span>
                    </div>

                    <div className="flex flex-col items-end">
                        <p className="text-xs text-muted-foreground">Thành tiền</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(order.fields.total_with_tax)}</p>
                    </div>

                    {/* <Accordion type="single" collapsible className="w-full mt-auto">
                        <AccordionItem value="item-1" className="border-b-0">
                            <div className="flex justify-end" >
                                <AccordionTrigger className="p-0 hover:no-underline -mt-2" onClick={(e) => e.stopPropagation()}>

                                </AccordionTrigger>
                            </div>
                            <AccordionContent className="text-sm mt-2 space-y-1">


                            </AccordionContent>
                        </AccordionItem>
                    </Accordion> */}

                </CardContent>

                <CardFooter className="p-3 flex items-center justify-between gap-2 bg-muted/30">
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} className="text-xs h-8 pointer-events-none bg-white border">
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Xem chi tiết
                    </Button>

                    <div className="flex gap-2">
                        {hasInvoiceFile ? (
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadInvoice(e, order);
                                }}
                                disabled={isDownloading}
                            >
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Tải file
                            </Button>
                        ) : (
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmitInvoice(order);
                                }}
                                disabled={isSubmittingInvoice && submittingOrderId === order.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold h-8 text-xs"
                            >
                                {(isSubmittingInvoice && submittingOrderId === order.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Xuất HĐ
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
});
OrderCard.displayName = 'OrderCard';
