
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
  createImportSlip, // NEW
} from '@/api';
import type { Order, OrderDetail, CreateOrderAPIPayload, ProcessedAudioResponse, CreateInvoiceRequest, CreateImportSlipPayload, CreateImportSlipResponse } from '@/types/order';

// For History Page
export function useFetchOrders(page: number, invoiceStateFilter: boolean | null) {
  const { tableOrderId } = useAuthStore();
  return useQuery({
    queryKey: ['orders', page, invoiceStateFilter],
    queryFn: () => fetchOrders({ tableId: tableOrderId!, page, invoiceStateFilter }),
    staleTime: 0,
    enabled: !!tableOrderId
  });
}

export function useFetchTotalOrders(invoiceStateFilter: boolean | null) {
    const { tableOrderId, isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ['totalOrders', tableOrderId, invoiceStateFilter],
        queryFn: () => fetchTotalOrders(tableOrderId!, invoiceStateFilter),
        enabled: !!tableOrderId && isAuthenticated,
        staleTime: 0,
    })
}

export function useFetchOrderDetails(orderId: string | null) {
    const { tableOrderDetailId } = useAuthStore();
    return useQuery({
        queryKey: ['orderDetails', orderId, tableOrderDetailId],
        queryFn: () => fetchOrderDetails({ orderId: orderId!, tableId: tableOrderDetailId! }),
        enabled: !!orderId && !!tableOrderDetailId,
        staleTime: 0,
        cacheTime: 0,
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
        itemName: item.fields.product_name_lookup[0],
        unitName: item.fields.unit_conversions?.title || '',
        unitPrice: item.fields.unit_price ?? 0,
        quantity: item.fields.quantity ?? 0,
        selection: 1,
        itemTotalAmountWithoutTax: (item.fields.unit_price ?? 0) * (item.fields.quantity ?? 0),
        taxPercentage: item.fields.vat ?? 0,
        taxAmount: ((item.fields.unit_price ?? 0) * (item.fields.quantity ?? 0)) * ((item.fields.vat ?? 0) / 100)
    }));

    const uniqueVatRates = Array.from(new Set(details.map(item => item.fields.vat).filter(vat => vat !== null && vat > 0) as number[]));
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
    const { username, tableOrderId, tableOrderDetailId, uploadFileId } = useAuthStore();

    return useMutation({
        mutationFn: async (order: Order) => {
            if (!username || !tableOrderDetailId || !tableOrderId || !uploadFileId) throw new Error("Thiếu dữ liệu người dùng để xuất hoá đơn.");

            const details = await fetchOrderDetails({ orderId: order.id, tableId: tableOrderDetailId });

            if (!details || details.length === 0) throw new Error("Không tìm thấy chi tiết đơn hàng để xuất hoá đơn.");
            
            return _generateAndSubmitInvoice(order, details, username, tableOrderId, uploadFileId);
        },
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Hoá đơn đã được xuất và đơn hàng đã được cập nhật.' });
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
  onSuccessCallback: (data: ProcessedAudioResponse) => void,
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

export function useCreateOrder(options?: { onSuccess?: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { tableOrderId, tableOrderDetailId } = useAuthStore();
  
    return useMutation({
      mutationFn: (payload: CreateOrderAPIPayload) => {
        if (!tableOrderId || !tableOrderDetailId) {
          throw new Error('Table IDs are not configured in your account.');
        }
        const completePayload: CreateOrderAPIPayload = {
          ...payload
        };
        return createOrder(completePayload);
      },
      onSuccess: () => {
        toast({ title: 'Thành công', description: 'Đơn hàng đã được tạo thành công.' });
        queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate products to update inventory
        options?.onSuccess?.();
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Không thể tạo đơn hàng.';
        toast({ title: 'Lỗi Tạo Đơn Hàng', description: errorMessage, variant: 'destructive' });
      },
    });
}

// For Import Slip (NEW)
export function useCreateImportSlip(options?: { onSuccess?: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateImportSlipPayload): Promise<CreateImportSlipResponse> => {
            return createImportSlip(payload);
        },
        onSuccess: () => {
            toast({ title: 'Thành công', description: "Nhập kho thành công." });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate products to update inventory
            options?.onSuccess?.();
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.detail || error.message || 'Không thể tạo phiếu nhập.';
            toast({ title: 'Lỗi Tạo Phiếu Nhập', description: errorMessage, variant: 'destructive' });
        },
    });
}
