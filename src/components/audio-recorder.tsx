
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, AlertTriangle, FileText, RotateCcw, User, Save, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from '@/store/auth-store';
import { transcribeAudio, createOrder, createViettelInvoice, updateOrderRecord } from '@/api';
import type { ExtractedItem, TranscriptionResponse, CreateOrderPayload } from '@/types/order';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'transcribed' | 'error';

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [editableOrderItems, setEditableOrderItems] = useState<ExtractedItem[] | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  
  const { username, tableOrderId, tableOrderDetailId } = useAuthStore();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const MAX_RECORDING_TIME_SECONDS = 60;

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      stopMediaStream();
    };
  }, []);

  const orderTotals = useMemo(() => {
    if (!editableOrderItems) {
      return { totalBeforeVat: 0, totalVatAmount: 0, totalAfterVat: 0 };
    }
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
    return { ...totals, totalAfterVat: totals.totalBeforeVat + totals.totalVatAmount };
  }, [editableOrderItems]);

  const transcriptionMutation = useMutation({
    mutationFn: transcribeAudio,
    onSuccess: (data: TranscriptionResponse) => {
      const processedExtracted = data.extracted
        ? data.extracted.map(item => ({
            ...item,
            so_luong: item.so_luong ?? null,
            don_gia: item.don_gia ?? null,
            vat: item.vat ?? null,
          }))
        : null;

      setResult({ ...data, extracted: processedExtracted });
      setEditableOrderItems(processedExtracted ? JSON.parse(JSON.stringify(processedExtracted)) : null);
      setRecordingState('transcribed');
      toast({ title: 'Chuyển đổi hoàn tất', description: 'Âm thanh đã được chuyển đổi thành công.' });
    },
    onError: (error: any) => {
        const errorMessage = error.response?.data?.message || error.message || 'Không thể chuyển đổi âm thanh.';
        toast({ title: 'Lỗi Tải Lên', description: errorMessage, variant: 'destructive' });
        setRecordingState('error');
    }
  });

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const startCountdown = () => {
    setCountdown(MAX_RECORDING_TIME_SECONDS);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          if (mediaRecorderRef.current?.state === 'recording') {
            handleStopRecording();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const uploadAudio = (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    transcriptionMutation.mutate(formData);
  };

  const handleStartRecording = async () => {
    setResult(null); setAudioBlob(null); setEditableOrderItems(null); setBuyerName('');
    setRecordingState('permission_pending'); setCountdown(0);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingState('recording');
      toast({ title: 'Bắt đầu ghi âm', description: 'Microphone đang hoạt động.', duration: 3000 });

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stopMediaStream();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (audioChunksRef.current.length === 0) {
            setRecordingState('error');
            toast({ title: 'Lỗi Ghi Âm', description: 'Không có dữ liệu âm thanh được ghi lại.', variant: 'destructive' });
            return;
        }
        const completeBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(completeBlob);
        setRecordingState('processing');
        uploadAudio(completeBlob);
      };
      recorder.onerror = () => {
        toast({ title: 'Lỗi Ghi Âm', description: 'Gặp sự cố với thiết bị ghi âm.', variant: 'destructive' });
        setRecordingState('error'); stopMediaStream();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
      recorder.start(); startCountdown();
    } catch (err) {
      toast({ title: 'Lỗi Microphone', description: 'Không thể truy cập microphone.', variant: 'destructive' });
      setRecordingState('error');
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(0);
  };

  const handleOrderItemChange = (itemIndex: number, field: keyof ExtractedItem, value: string) => {
    if (!editableOrderItems) return;
    const updatedItems = [...editableOrderItems];
    const itemToUpdate = { ...updatedItems[itemIndex] };
    let processedValue: string | number | null = value;
    if (field === 'so_luong' || field === 'don_gia' || field === 'vat') {
      processedValue = value.trim() === '' ? null : parseFloat(value) || 0;
    }
    (itemToUpdate as any)[field] = processedValue;
    updatedItems[itemIndex] = itemToUpdate;
    setEditableOrderItems(updatedItems);
  };

  const validateOrder = (): CreateOrderPayload | null => {
    if (!editableOrderItems || editableOrderItems.length === 0) {
      toast({ title: 'Lỗi Đơn Hàng', description: 'Không có mặt hàng nào để xử lý.', variant: 'destructive' }); return null;
    }
    if (!buyerName.trim()) {
      toast({ title: 'Thiếu Thông Tin', description: 'Vui lòng nhập tên người mua.', variant: 'destructive' }); return null;
    }
    if (!tableOrderId || !tableOrderDetailId) {
        toast({ title: 'Lỗi Cấu Hình', description: 'Không tìm thấy ID bảng. Vui lòng đăng nhập lại.', variant: 'destructive' }); return null;
    }

    const order_details = editableOrderItems.map(item => {
        const temp_total = (item.don_gia ?? 0) * (item.so_luong ?? 0);
        const vat_amount = temp_total * ((item.vat ?? 0) / 100);
        return { product_name: item.ten_hang_hoa || "Không có tên", unit_price: item.don_gia ?? 0, quantity: item.so_luong ?? 0, vat: item.vat ?? 0, temp_total, final_total: temp_total + vat_amount, };
    });

    return {
      customer_name: buyerName.trim(), order_details, order_table_id: tableOrderId, detail_table_id: tableOrderDetailId,
      total_temp: orderTotals.totalBeforeVat, total_vat: orderTotals.totalVatAmount, total_after_vat: orderTotals.totalAfterVat
    };
  };
  
  const saveOrderMutation = useMutation({
      mutationFn: (payload: { orderPayload: CreateOrderPayload, invoiceState: boolean}) => createOrder({...payload.orderPayload, invoice_state: payload.invoiceState}),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          toast({ title: 'Lưu đơn hàng thành công!' });
          router.push('/history');
      },
      onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Không thể lưu đơn hàng.';
          toast({ title: 'Lỗi Lưu Đơn Hàng', description: errorMessage, variant: 'destructive' });
      }
  });

  const saveAndInvoiceMutation = useMutation({
      mutationFn: async (orderPayload: CreateOrderPayload) => {
          if (!username || !tableOrderId) throw new Error("Thông tin người dùng hoặc cấu hình không đầy đủ.");
          
          const recordId = await createOrder({...orderPayload, invoice_state: true});
          
          const itemsForApi = editableOrderItems!.map((item, index) => {
              const unitPrice = item.don_gia ?? 0, quantity = item.so_luong ?? 0;
              const itemTotalAmountWithoutTax = unitPrice * quantity;
              const taxPercentage = item.vat ?? 0;
              const taxAmount = itemTotalAmountWithoutTax * (taxPercentage / 100);
              return { lineNumber: index + 1, itemName: item.ten_hang_hoa || "Không có tên", unitName: "Chiếc", unitPrice, quantity, selection: 1, itemTotalAmountWithoutTax, taxPercentage, taxAmount };
          });
          const uniqueVatRates = Array.from(new Set(editableOrderItems!.map(item => item.vat).filter(vat => vat != null && vat > 0) as number[]));
          const taxBreakdowns = uniqueVatRates.length > 0 ? uniqueVatRates.map(rate => ({ taxPercentage: rate })) : [{ taxPercentage: 0 }];

          const invoicePayload = {
              generalInvoiceInfo: { invoiceType: "01GTKT", templateCode: "1/772", invoiceSeries: "C25MMV", currencyCode: "VND", adjustmentType: "1", paymentStatus: true, cusGetInvoiceRight: true },
              buyerInfo: { buyerName: buyerName.trim() }, payments: [{ paymentMethodName: "CK" }], taxBreakdowns, itemInfo: itemsForApi
          };
          
          const { invoiceNo } = await createViettelInvoice({ username, payload: invoicePayload });
          await updateOrderRecord({ orderId: recordId, tableId: tableOrderId, payload: { order_number: invoiceNo } });

          return { recordId, invoiceNo };
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          toast({ title: "Thành công", description: "Đã lưu và xuất hoá đơn." });
          router.push('/history');
      },
      onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Không thể tạo hoặc xuất hóa đơn.';
          toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive', duration: 7000 });
          router.push('/history');
      }
  });


  const handleSaveOnly = () => {
    const orderPayload = validateOrder();
    if (orderPayload) {
        saveOrderMutation.mutate({ orderPayload, invoiceState: false });
    }
  };

  const handleSaveAndInvoice = () => {
    const orderPayload = validateOrder();
    if (orderPayload) {
        saveAndInvoiceMutation.mutate(orderPayload);
    }
  };

  const handleCancelOrderChanges = () => {
    setEditableOrderItems(result?.extracted ? JSON.parse(JSON.stringify(result.extracted)) : null);
    setBuyerName('');
    toast({ title: 'Đã hoàn tác', description: 'Các thay đổi trong đơn hàng đã được hoàn tác.' });
  };
  
  const isProcessing = transcriptionMutation.isPending || saveOrderMutation.isPending || saveAndInvoiceMutation.isPending;

  const getButtonIcon = () => {
    if (recordingState === 'recording') return <Mic className="h-6 w-6 animate-mic-active" />;
    if (isProcessing || recordingState === 'permission_pending' || recordingState === 'processing') return <Loader2 className="h-6 w-6 animate-spin" />;
    return <Mic className="h-6 w-6" />;
  };
  
  return (
    <Card className="w-full shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-card border-b border-border">
        <CardTitle className="flex items-center text-2xl font-headline text-primary">Tạo hoá đơn</CardTitle>
        <CardDescription>Nhấn nút micro để ghi âm (tối đa {MAX_RECORDING_TIME_SECONDS} giây). {recordingState === 'recording' && `Còn lại: ${countdown}s`}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
            disabled={isProcessing || recordingState === 'permission_pending' || recordingState === 'processing'}
            className={`w-20 h-20 rounded-full text-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 ${recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'} ${isProcessing ? 'cursor-not-allowed' : ''}`}
            aria-label={recordingState === 'recording' ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            variant={recordingState === 'recording' ? 'destructive' : 'default'}
          >
            {getButtonIcon()}
          </Button>
          {recordingState === 'recording' && <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="w-full max-w-xs mt-3 h-2.5 rounded-full [&>div]:bg-red-500" />}
        </div>

        {result && (
          <div className="space-y-6 pt-6 border-t">
            <Card className="bg-secondary/20 shadow-md">
              <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6 text-primary" />Bản Ghi</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap p-4 bg-background rounded-md shadow-inner">{result.transcription}</p></CardContent>
            </Card>
            
            {editableOrderItems && editableOrderItems.length > 0 ? (
              <Card>
                <CardHeader><CardTitle>Đơn Hàng (Có thể chỉnh sửa)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                     <Label htmlFor="buyerName" className="flex items-center"><User className="mr-2 h-4 w-4" />Tên người mua</Label>
                     <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nhập tên người mua hàng" />
                  </div>
                  {editableOrderItems.map((item, idx) => (
                    <div key={idx} className="border p-4 rounded-md shadow-sm bg-secondary/10 space-y-3">
                      <div><Label htmlFor={`ten_${idx}`}>Tên hàng hóa</Label><Input id={`ten_${idx}`} value={item.ten_hang_hoa} onChange={(e) => handleOrderItemChange(idx, 'ten_hang_hoa', e.target.value)} /></div>
                      <div><Label htmlFor={`sl_${idx}`}>Số lượng</Label><Input id={`sl_${idx}`} type="number" value={String(item.so_luong ?? '')} onChange={(e) => handleOrderItemChange(idx, 'so_luong', e.target.value)} /></div>
                      <div><Label htmlFor={`dg_${idx}`}>Đơn giá (VND)</Label><Input id={`dg_${idx}`} type="number" value={String(item.don_gia ?? '')} onChange={(e) => handleOrderItemChange(idx, 'don_gia', e.target.value)} /><p className="text-xs text-muted-foreground mt-1">Giá trị: {Number(item.don_gia ?? 0).toLocaleString()} VND</p></div>
                      <div><Label htmlFor={`vat_${idx}`}>Thuế GTGT (%)</Label><Input id={`vat_${idx}`} type="number" value={String(item.vat ?? '')} onChange={(e) => handleOrderItemChange(idx, 'vat', e.target.value)} placeholder="Ví dụ: 10" /></div>
                    </div>
                  ))}
                  <div className="pt-4 mt-4 border-t">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between"><span>Tổng tiền hàng (trước thuế):</span><span className="font-semibold">{orderTotals.totalBeforeVat.toLocaleString('vi-VN')} VND</span></div>
                        <div className="flex justify-between"><span>Tổng tiền thuế GTGT:</span><span className="font-semibold">{orderTotals.totalVatAmount.toLocaleString('vi-VN')} VND</span></div>
                        <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t border-dashed"><span>Tổng cộng thanh toán:</span><span>{orderTotals.totalAfterVat.toLocaleString('vi-VN')} VND</span></div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={handleCancelOrderChanges} disabled={isProcessing}><RotateCcw className="mr-2 h-4 w-4" />Hoàn tác</Button>
                      <Button onClick={handleSaveOnly} disabled={isProcessing}>{saveOrderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu đơn hàng</Button>
                      <Button onClick={handleSaveAndInvoice} disabled={isProcessing}>{saveAndInvoiceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Lưu & Xuất hoá đơn</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : <p className="text-muted-foreground">Không có mặt hàng nào được trích xuất.</p>}
          </div>
        )}
        {recordingState === 'error' && !result && (
          <Card className="bg-destructive/10 border-destructive mt-6"><CardHeader><CardTitle className="flex items-center text-destructive-foreground"><AlertTriangle className="mr-2 h-6 w-6" />Lỗi</CardTitle></CardHeader><CardContent><p className="text-destructive-foreground">Không thể xử lý âm thanh. Vui lòng thử lại.</p></CardContent></Card>
        )}
      </CardContent>
      <CardFooter className="flex justify-center p-4 border-t">
        {audioBlob && recordingState !== 'processing' && !isProcessing && (<audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />)}
      </CardFooter>
    </Card>
  );
}

// Define types in a separate file for better organization
declare module '@/types/order' {
    interface ExtractedItem { ten_hang_hoa: string; so_luong: number | null; don_gia: number | null; vat: number | null; }
    interface TranscriptionResponse { language: string; transcription: string; extracted: ExtractedItem[] | null; }
    interface OrderDetailItem { product_name: string; unit_price: number; quantity: number; vat: number; temp_total: number; final_total: number; }
    interface CreateOrderPayload { customer_name: string; order_details: OrderDetailItem[]; order_table_id: string; detail_table_id: string; invoice_state?: boolean; total_temp: number; total_vat: number; total_after_vat: number; }
    interface Order { id: string; fields: { order_number: number | string | null; customer_name: string; total_temp: number; total_vat: number; total_after_vat: number; createdTime: string; invoice_state?: boolean; }; }
    interface OrderDetail { id: string; fields: { product_name: string; unit_price: number; quantity: number; vat: number; temp_total: number; final_total: number; }; }
}
