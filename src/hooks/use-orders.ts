
'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchOrders,
  fetchOrderDetails,
  createOrder,
  updateOrderRecord,
  createViettelInvoice,
  transcribeAudio,
} from '@/api';
import type { Order, OrderDetail, CreateOrderPayload, ExtractedItem, TranscriptionResponse } from '@/types/order';

// For History Page
export function useFetchOrders() {
  const { tableOrderId, isAuthenticated } = useAuthStore();
  return useInfiniteQuery({
    queryKey: ['orders', tableOrderId],
    queryFn: ({ pageParam }) => fetchOrders({ pageParam, tableId: tableOrderId! }),
    getNextPageParam: (lastPage) => lastPage.offset,
    initialPageParam: null,
    enabled: !!tableOrderId && isAuthenticated,
  });
}

export function useFetchOrderDetails(orderId: string | null) {
    const { tableOrderDetailId } = useAuthStore();
    return useQuery({
        queryKey: ['orderDetails', orderId, tableOrderDetailId],
        queryFn: () => fetchOrderDetails({ orderId: orderId!, tableId: tableOrderDetailId! }),
        enabled: !!orderId && !!tableOrderDetailId,
    });
}

export function useSubmitInvoice() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { username, tableOrderId, tableOrderDetailId } = useAuthStore();

    return useMutation({
        mutationFn: async (order: Order) => {
            if (!username || !tableOrderDetailId || !tableOrderId) throw new Error("Thiếu dữ liệu người dùng để xuất hoá đơn.");

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
            const taxBreakdowns = uniqueVatRates.length > 0 ? uniqueVatRates.map(rate => ({ taxPercentage: rate })) : [];

            const invoice_payload = {
                generalInvoiceInfo: { invoiceType: "01GTKT", templateCode: "1/772", invoiceSeries: "C25MMV", currencyCode: "VND", adjustmentType: "1", paymentStatus: true, cusGetInvoiceRight: true },
                buyerInfo: { buyerName: order.fields.customer_name },
                payments: [{ paymentMethodName: "CK" }],
                taxBreakdowns, itemInfo: itemsForApi
            };

            const invoiceResponse = await createViettelInvoice({ username, order_table_id: tableOrderId, record_order_id: order.id, invoice_payload });
            if (!invoiceResponse || !invoiceResponse.invoiceNo) {
                throw new Error("Phản hồi không chứa mã hoá đơn.");
            }
            const { invoiceNo } = invoiceResponse;

            await updateOrderRecord({ orderId: order.id, tableId: tableOrderId, payload: { order_number: invoiceNo, invoice_state: true } });
            return invoiceNo;
        },
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Hoá đơn đã được xuất và đơn hàng đã được cập nhật.' });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.response?.data?.error_message || error.detail || 'Không thể gửi hóa đơn.';
            toast({ title: 'Lỗi Xuất Hóa Đơn', description: errorMessage, variant: 'destructive', duration: 7000 });
        }
    });
}

// For Audio Recorder
export function useTranscribeAudio(onSuccessCallback: (data: TranscriptionResponse) => void) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: transcribeAudio,
        onSuccess: onSuccessCallback,
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.detail || 'Không thể chuyển đổi âm thanh.';
            toast({ title: 'Lỗi Tải Lên', description: errorMessage, variant: 'destructive' });
        }
    });
}

export function useSaveOrder() {
    const { toast } = useToast();
    const router = useRouter();

    return useMutation({
        mutationFn: (payload: { orderPayload: CreateOrderPayload, invoiceState: boolean}) => createOrder({...payload.orderPayload, invoice_state: payload.invoiceState}),
        onSuccess: (data) => {
            if (data) {
                toast({ title: 'Lưu đơn hàng thành công!' });
                console.log("data: ",data)
                router.push('/history');
            } else {
                toast({ title: 'Lỗi Lưu Đơn Hàng', description: 'Không nhận được ID đơn hàng từ máy chủ.', variant: 'destructive' });
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
    const queryClient = useQueryClient();
    const router = useRouter();
    const { username, tableOrderId } = useAuthStore();
    
    return useMutation({
        mutationFn: async (payload: {orderPayload: CreateOrderPayload, editableOrderItems: ExtractedItem[], buyerName: string}) => {
            const { orderPayload, editableOrderItems, buyerName } = payload;
            if (!username || !tableOrderId || !editableOrderItems) throw new Error("Thông tin người dùng hoặc cấu hình không đầy đủ.");
            
            const createOrderResponse = await createOrder({...orderPayload, invoice_state: true});
            if (!createOrderResponse) {
                throw new Error("Không thể tạo đơn hàng, không nhận được ID bản ghi.");
            }
            const recordId = createOrderResponse.recordId;
            
            const itemsForApi = editableOrderItems!.map((item, index) => {
                const unitPrice = item.don_gia ?? 0;
                const quantity = item.so_luong ?? 0;
                const itemTotalAmountWithoutTax = unitPrice * quantity;
                const taxPercentage = item.vat ?? 0;
                const taxAmount = itemTotalAmountWithoutTax * (taxPercentage / 100);
                return { lineNumber: index + 1, itemName: item.ten_hang_hoa || "Không có tên", unitName: "Chiếc", unitPrice, quantity, selection: 1, itemTotalAmountWithoutTax, taxPercentage, taxAmount };
            });
            const uniqueVatRates = Array.from(new Set(editableOrderItems!.map(item => item.vat).filter(vat => vat != null && vat > 0) as number[]));
            const taxBreakdowns = uniqueVatRates.length > 0 ? uniqueVatRates.map(rate => ({ taxPercentage: rate })) : [];

            const invoice_payload = {
                generalInvoiceInfo: { invoiceType: "01GTKT", templateCode: "1/772", invoiceSeries: "C25MMV", currencyCode: "VND", adjustmentType: "1", paymentStatus: true, cusGetInvoiceRight: true },
                buyerInfo: { buyerName: buyerName.trim() }, payments: [{ paymentMethodName: "CK" }], taxBreakdowns, itemInfo: itemsForApi
            };
            
            const invoiceResponse = await createViettelInvoice({ username, order_table_id: tableOrderId, record_order_id: recordId, invoice_payload });
            if (!invoiceResponse || !invoiceResponse.invoiceNo) {
                throw new Error("Phản hồi không chứa mã hoá đơn.");
            }
            const { invoiceNo } = invoiceResponse;
            await updateOrderRecord({ orderId: recordId, tableId: tableOrderId, payload: { order_number: invoiceNo } });

            return { recordId, invoiceNo };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast({ title: "Thành công", description: "Đã lưu và xuất hoá đơn." });
            router.push('/history');
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.detail || 'Không thể tạo hoặc xuất hóa đơn.';
            toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive', duration: 7000 });
        }
    });
}
