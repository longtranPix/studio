
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Loader2, AlertTriangle, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from '@/store/auth-store';
import type { ExtractedItem, TranscriptionResponse, CreateOrderPayload, ProcessedAudioResponse, ProductData } from '@/types/order';
import { useTranscribeAudio, useSaveOrder, useSaveAndInvoice } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { OrderForm } from '@/components/home/order-form';
import { ProductForm } from '@/components/home/product-form';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'processed' | 'error';
type FormMode = 'order' | 'product' | 'none';

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  
  // Order form states
  const [orderData, setOrderData] = useState<TranscriptionResponse | null>(null);
  const [editableOrderItems, setEditableOrderItems] = useState<ExtractedItem[] | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CK' | 'TM'>('CK');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isInvoicing, setIsInvoicing] = useState(false);

  // Product form states
  const [productData, setProductData] = useState<ProductData | null>(null);

  const { tableOrderId, tableOrderDetailId } = useAuthStore();
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const MAX_RECORDING_TIME_SECONDS = 60;

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      stopMediaStream();
    };
  }, []);

  const orderTotals = useMemo(() => {
    if (formMode !== 'order' || !editableOrderItems) {
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
  }, [editableOrderItems, formMode]);

  const { mutate: transcribe, isPending: isTranscribing } = useTranscribeAudio(
    (data: ProcessedAudioResponse) => {
      setRecordingState('processed');
      setTranscription(data.transcription);
      
      if (data.intent === 'create_invoice' && data.invoice_data) {
        setFormMode('order');
        const processedExtracted = data.invoice_data.extracted
          ? data.invoice_data.extracted.map(item => ({
            ...item,
            don_vi_tinh: item.don_vi_tinh ?? 'cái',
            so_luong: item.so_luong ?? null,
            don_gia: item.don_gia ?? null,
            vat: item.vat ?? null,
          }))
          : [];
        setOrderData({ ...data.invoice_data, extracted: processedExtracted });
        setBuyerName(data.invoice_data.customer_name || '');
        setEditableOrderItems(processedExtracted ? JSON.parse(JSON.stringify(processedExtracted)) : []);
        toast({ title: 'Chuyển đổi hoàn tất', description: 'Đã nhận dạng yêu cầu tạo hoá đơn.' });
      } else if (data.intent === 'create_product' && data.product_data) {
        setFormMode('product');
        setProductData(data.product_data);
        toast({ title: 'Chuyển đổi hoàn tất', description: 'Đã nhận dạng yêu cầu tạo hàng hoá.' });
      } else {
        setFormMode('none');
        toast({ title: 'Không nhận dạng được yêu cầu', description: 'Vui lòng thử lại với yêu cầu tạo đơn hàng hoặc tạo hàng hoá.', variant: 'destructive' });
      }
    },
    () => {
      setRecordingState('error');
    }
  );

  const { mutate: saveOrder } = useSaveOrder();
  const { mutate: saveAndInvoice } = useSaveAndInvoice();


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
    formData.append('audio', blob, 'recording.webm');
    transcribe(formData);
  };

  const resetAll = () => {
    setOrderData(null);
    setProductData(null);
    setAudioBlob(null);
    setEditableOrderItems(null);
    setBuyerName('');
    setRecordingState('idle');
    setPaymentMethod('CK');
    setFormMode('none');
    setTranscription('');
  };

  const handleStartRecording = async () => {
    resetAll();
    setRecordingState('permission_pending');
    setCountdown(0);
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
      return {
        product_name: item.ten_hang_hoa || "Không có tên",
        unit_name: item.don_vi_tinh || 'cái',
        unit_price: item.don_gia ?? 0,
        quantity: item.so_luong ?? 0,
        vat: item.vat ?? 0,
        temp_total,
        final_total: temp_total + vat_amount,
      };
    });

    return {
      customer_name: buyerName.trim(), order_details, order_table_id: tableOrderId, detail_table_id: tableOrderDetailId,
      total_temp: orderTotals.totalBeforeVat, total_vat: orderTotals.totalVatAmount, total_after_vat: orderTotals.totalAfterVat,
      payment_method: paymentMethod
    };
  };

  const handleSaveOnly = () => {
    const orderPayload = validateOrder();
    if (orderPayload) {
      setIsSavingOrder(true);
      saveOrder({ orderPayload, invoiceState: false }, {
          onSuccess: () => router.push('/history'),
          onSettled: () => setIsSavingOrder(false),
      });
    }
  };

  const handleSaveAndInvoice = () => {
    const orderPayload = validateOrder();
    if (orderPayload && editableOrderItems) {
      setIsInvoicing(true);
      saveAndInvoice({ orderPayload, editableOrderItems, buyerName }, {
          onSuccess: () => router.push('/history'),
          onSettled: () => setIsInvoicing(false),
      });
    }
  };

  const handleCancelOrderChanges = () => {
    setEditableOrderItems(orderData?.extracted ? JSON.parse(JSON.stringify(orderData.extracted)) : []);
    setBuyerName(orderData?.customer_name || '');
    toast({ title: 'Đã hoàn tác', description: 'Các thay đổi trong đơn hàng đã được hoàn tác.' });
  };

  const isProcessing = isTranscribing || isSavingOrder || isInvoicing;

  const getRecorderStateDetails = () => {
    switch (recordingState) {
      case 'recording':
        return { title: 'Đang ghi âm...', description: `Thời gian còn lại: ${countdown}s`, icon: <Square className="h-10 w-10 sm:h-12 sm:h-12" /> };
      case 'permission_pending':
        return { title: 'Yêu cầu quyền...', description: 'Vui lòng cho phép truy cập microphone.', icon: <Loader2 className="h-14 w-14 sm:h-16 sm:h-16 animate-spin" /> };
      case 'processing':
        return { title: 'Đang xử lý âm thanh...', description: 'Vui lòng chờ trong giây lát.', icon: <Mic className="w-14 h-14 !w-10 !h-10 !sm:w-16 !sm:h-16" strokeWidth={1.3} /> };
      case 'processed':
        return { title: 'Ghi âm lại?', description: 'Nhấn vào micro để bắt đầu ghi âm mới.', icon: <Mic className="w-14 h-14 !w-10 !h-10 !sm:w-16 !sm:h-16" strokeWidth={1.3} /> };
      case 'error':
        return { title: 'Gặp lỗi', description: 'Nhấn để thử lại.', icon: <AlertTriangle className="h-14 w-14 sm:h-16 sm:h-16" /> };
      case 'idle':
      default:
        return { title: 'Sẵn sàng ghi âm', description: 'Nhấn vào micro để bắt đầu ghi âm', icon: <Mic className="w-14 h-14 !w-10 !h-10 !sm:w-16 !sm:h-16" strokeWidth={1.3} /> };
    }
  };

  const { title, description, icon } = getRecorderStateDetails();

  return (
    <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
      <Card className="w-full shadow-lg rounded-xl overflow-hidden border">
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4 text-center">
          <div className="relative flex items-center justify-center">
            {recordingState === 'idle' && (
              <span className="absolute inline-flex h-24 w-24 sm:h-30 sm:w-30 rounded-full bg-primary/20 opacity-75 animate-ping"></span>
            )}
            <Button
              onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
              disabled={recordingState === 'recording' ? false : (isProcessing || recordingState === 'permission_pending')}
              className={cn(
                "relative w-24 h-24 sm:w-30 sm:h-30 rounded-full text-white text-lg flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl",
                recordingState === 'recording' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
              )}
              aria-label={title}
            >
              {icon}
            </Button>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>

          {recordingState === 'recording' && (
            <div className="w-full max-w-sm pt-2">
              <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="h-2 rounded-full [&>div]:bg-red-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {(isTranscribing || formMode !== 'none' || recordingState === 'error') && (
        <>
          {formMode === 'order' && (
            <OrderForm
              result={orderData}
              isTranscribing={isTranscribing}
              isSaving={isSavingOrder}
              isInvoicing={isInvoicing}
              editableOrderItems={editableOrderItems}
              buyerName={buyerName}
              paymentMethod={paymentMethod}
              orderTotals={orderTotals}
              audioBlob={audioBlob}
              handleOrderItemChange={handleOrderItemChange}
              setBuyerName={setBuyerName}
              setPaymentMethod={setPaymentMethod}
              handleCancelOrderChanges={handleCancelOrderChanges}
              handleSaveOnly={handleSaveOnly}
              handleSaveAndInvoice={handleSaveAndInvoice}
            />
          )}
          {formMode === 'product' && (
              <ProductForm 
                initialData={productData}
                onCancel={resetAll}
                transcription={transcription}
              />
          )}
           {formMode === 'none' && !isTranscribing && transcription && (
              <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                  <CardContent className="p-4 sm:p-6">
                      <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                      <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{transcription}</p>
                  </CardContent>
              </Card>
           )}
        </>
      )}
    </div>
  );
}
