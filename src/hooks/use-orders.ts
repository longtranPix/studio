
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchOrders,
  fetchTotalOrders,
  fetchOrderDetails,
  createOrder,
  createViettelInvoice,
  transcribeAudio,
} from '@/api';
import type { Order, OrderDetail, CreateOrderPayload, ExtractedItem, TranscriptionResponse, TeableCreateOrderResponse, CreateInvoiceRequest } from '@/types/order';

// For History Page
export function useFetchOrders(page: number, invoiceStateFilter: boolean | null) {
  const { tableOrderId, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['orders', page, invoiceStateFilter],
    queryFn: () => fetchOrders({ tableId: tableOrderId!, page, invoiceStateFilter }),
    staleTime: 0,
    enabled: !!tableOrderId && !!accessToken
  });
}

export function useFetchTotalOrders(invoiceStateFilter: boolean | null) {
    const { tableOrderId, isAuthenticated, accessToken } = useAuthStore();
    return useQuery({
        queryKey: ['totalOrders', tableOrderId, invoiceStateFilter],
        queryFn: () => fetchTotalOrders(tableOrderId!, invoiceStateFilter),
        enabled: !!tableOrderId && isAuthenticated && !!accessToken,
        staleTime: 0,
    })
}

export function useFetchOrderDetails(orderId: string | null) {
    const { tableOrderDetailId, accessToken } = useAuthStore();
    return useQuery({
        queryKey: ['orderDetails', orderId, tableOrderDetailId],
        queryFn: () => fetchOrderDetails({ orderId: orderId!, tableId: tableOrderDetailId! }),
        enabled: !!orderId && !!tableOrderDetailId && !!accessToken,
        staleTime: 0,
        gcTime: 0,
    });
}

const _generateAndSubmitInvoice = async (
    order: Order,
    details: OrderDetail[],
    username: string,
    tableOrderId: string,
    uploadFileId: string
) => {
    const itemsForApi = details.map((item, index) => ({
        lineNumber: index + 1,
        itemName: item.fields.product_name,
        unitName: 'cái', // Default unit name since it's not in the schema
        unitPrice: item.fields.unit_price ?? 0,
        quantity: item.fields.quantity ?? 0,
        selection: 1,
        itemTotalAmountWithoutTax: item.fields.temp_total ?? 0,
        taxPercentage: item.fields.vat_rate ?? 0,
        taxAmount: item.fields.vat_price ?? 0
    }));

    const uniqueVatRates = Array.from(new Set(details.map(item => item.fields.vat_rate).filter(vat => vat !== null && vat > 0) as number[]));
    const taxBreakdowns = uniqueVatRates.length > 0 ? uniqueVatRates.map(rate => ({ taxPercentage: rate })) : [];

    const invoiceRequest: CreateInvoiceRequest = {
        username,
        order_table_id: tableOrderId,
        record_order_id: order.id,
        field_attachment_id: uploadFileId,
        invoice_payload: {
            generalInvoiceInfo: {
                currencyCode: "VND",
                adjustmentType: "1",
                paymentStatus: true,
                cusGetInvoiceRight: true
            },
            buyerInfo: { buyerName: order.fields.customer_name },
            payments: [{ paymentMethodName: order.fields.payment_method || 'CK' }],
            taxBreakdowns,
            itemInfo: itemsForApi
        }
    };

    const invoiceResponse = await createViettelInvoice(invoiceRequest);
    if (!invoiceResponse || !invoiceResponse.invoice_no) {
        throw new Error("Phản hồi không chứa mã hoá đơn.");
    }
    return invoiceResponse;
};


export function useSubmitInvoice() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { username, tableOrderId, tableOrderDetailId, uploadFileId, accessToken } = useAuthStore();

    return useMutation({
        mutationFn: async (order: Order) => {
            if (!username || !tableOrderDetailId || !tableOrderId || !uploadFileId || !accessToken) throw new Error("Thiếu dữ liệu người dùng để xuất hoá đơn.");

            const details = await fetchOrderDetails({ orderId: order.id, tableId: tableOrderDetailId });

            if (!details || details.length === 0) throw new Error("Không tìm thấy chi tiết đơn hàng để xuất hoá đơn.");
            
            return _generateAndSubmitInvoice(order, details, username, tableOrderId, uploadFileId);
        },
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Hoá đơn đã được xuất và đơn hàng đã được cập nhật.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['totalOrders'] });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.response?.data?.error_message || error.detail || 'Không thể gửi hóa đơn.';
            toast({ title: 'Lỗi Xuất Hóa Đơn', description: errorMessage, variant: 'destructive', duration: 7000 });
        }
    });
}

// For Audio Recorder
export function useTranscribeAudio(
  onSuccessCallback: (data: TranscriptionResponse) => void,
  onErrorCallback?: () => void
) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: transcribeAudio,
        onSuccess: onSuccessCallback,
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.detail || 'Không thể chuyển đổi âm thanh.';
            toast({ title: 'Lỗi Tải Lên', description: errorMessage, variant: 'destructive' });
            onErrorCallback?.();
        }
    });
}

export function useSaveOrder() {
    const { toast } = useToast();
    const { accessToken } = useAuthStore();

    return useMutation({
        mutationFn: (payload: { orderPayload: CreateOrderPayload }) => {
            if (!accessToken) throw new Error('No access token available');
            return createOrder(payload.orderPayload);
        },
        onSuccess: (data: TeableCreateOrderResponse) => {
            if (data && data.status === 'success') {
                toast({ title: 'Lưu đơn hàng thành công!', variant: 'success' });
            } else {
                toast({ title: 'Lỗi Lưu Đơn Hàng', description: 'Không nhận được phản hồi thành công từ máy chủ.', variant: 'destructive' });
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || 'Không thể lưu đơn hàng.';
            toast({ title: 'Lỗi Lưu Đơn Hàng', description: errorMessage, variant: 'destructive' });
        }
    });
}

export function useSaveAndInvoice() {
    const { toast } = useToast();
    const { username, tableOrderId, uploadFileId, accessToken } = useAuthStore();
    
    return useMutation({
        mutationFn: async (payload: {orderPayload: CreateOrderPayload, editableOrderItems: ExtractedItem[]}) => {
            const { orderPayload, editableOrderItems } = payload;
            if (!username || !tableOrderId || !editableOrderItems || !uploadFileId || !accessToken) throw new Error("Thông tin người dùng hoặc cấu hình không đầy đủ.");
            
            const createOrderResponse = await createOrder(orderPayload);
            if (!createOrderResponse || !createOrderResponse.order?.records?.[0]?.id) {
                throw new Error("Không thể tạo đơn hàng, không nhận được ID bản ghi.");
            }
            const recordId = createOrderResponse.order.records[0].id;
            
            // Calculate totals for invoice
            const totals = editableOrderItems.reduce(
                (acc, item) => {
                    const quantity = item.so_luong ?? 0;
                    const unitPrice = item.don_gia ?? 0;
                    const vatRate = item.vat ?? 0;
                    const itemTotal = quantity * unitPrice;
                    const vatAmount = itemTotal * (vatRate / 100);
                    acc.totalBeforeVat += itemTotal;
                    acc.totalVatAmount += vatAmount;
                    return acc;
                },
                { totalBeforeVat: 0, totalVatAmount: 0 }
            );
            
            const tempOrderForInvoice: Order = {
                id: recordId,
                createdTime: new Date().toISOString(),
                fields: {
                    order_code: orderPayload.order_code,
                    customer_name: orderPayload.customer_name,
                    invoice_state: true,
                    total_temp: totals.totalBeforeVat,
                    total_vat_price: totals.totalVatAmount,
                    total_with_tax: totals.totalBeforeVat + totals.totalVatAmount,
                    invoice_code: '',
                    invoice_file: [],
                    detail_orders: [],
                    created_time: new Date().toISOString(),
                    payment_method: orderPayload.payment_method as "Chuyển khoản" | "Tiền mặt",
                    status: "Chưa thanh toán"
                }
            };
            
            const detailsForInvoice: OrderDetail[] = editableOrderItems!.map(item => ({
                id: '', // Not needed for invoice generation
                fields: {
                    order_detail_code: '',
                    product_name: item.ten_hang_hoa || "Không có tên",
                    unit_price: item.don_gia ?? 0,
                    quantity: item.so_luong ?? 0,
                    vat_rate: item.vat ?? 0,
                    temp_total: (item.don_gia ?? 0) * (item.so_luong ?? 0),
                    total: ((item.don_gia ?? 0) * (item.so_luong ?? 0)) * (1 + ((item.vat ?? 0) / 100)),
                    vat_price: ((item.don_gia ?? 0) * (item.so_luong ?? 0)) * ((item.vat ?? 0) / 100),
                    order: recordId
                }
            }));
            
            return _generateAndSubmitInvoice(tempOrderForInvoice, detailsForInvoice, username, tableOrderId, uploadFileId);
        },
        onSuccess: () => {
            toast({ title: "Thành công", description: "Đã lưu và xuất hoá đơn.", variant: 'success' });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.detail || 'Không thể tạo hoặc xuất hóa đơn.';
            toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive', duration: 7000 });
        }
    });
}
