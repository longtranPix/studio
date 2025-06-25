
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, AlertTriangle, FileText, RotateCcw, User, Save, Send, Pen, Tag, Percent, CircleDollarSign, Package, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from '@/store/auth-store';
import type { ExtractedItem, TranscriptionResponse, CreateOrderPayload } from '@/types/order';
import { useTranscribeAudio, useSaveOrder, useSaveAndInvoice } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'transcribed' | 'error';

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined') return '';
    return `${value.toLocaleString('vi-VN')} VND`;
};

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [editableOrderItems, setEditableOrderItems] = useState<ExtractedItem[] | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  
  const { tableOrderId, tableOrderDetailId } = useAuthStore();
  
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

  const { mutate: transcribe, isPending: isTranscribing } = useTranscribeAudio((data) => {
    const processedExtracted = data.extracted
      ? data.extracted.map(item => ({
          ...item,
          so_luong: item.so_luong ?? null,
          don_gia: item.don_gia ?? null,
          vat: item.vat ?? null,
        }))
      : [];
    setResult({ ...data, extracted: processedExtracted });
    setBuyerName(data.customer_name || '');
    setEditableOrderItems(processedExtracted ? JSON.parse(JSON.stringify(processedExtracted)) : []);
    setRecordingState('transcribed');
    toast({ title: 'Chuyển đổi hoàn tất', description: 'Âm thanh đã được chuyển đổi thành công.' });
  });

  const { mutate: saveOrder, isPending: isSaving } = useSaveOrder();
  const { mutate: saveAndInvoice, isPending: isInvoicing } = useSaveAndInvoice();


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
  
  const resetAll = () => {
    setResult(null);
    setAudioBlob(null);
    setEditableOrderItems(null);
    setBuyerName('');
    setRecordingState('idle');
  }

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
  
  const handleSaveOnly = () => {
    const orderPayload = validateOrder();
    if (orderPayload) {
        saveOrder({ orderPayload, invoiceState: false });
    }
  };

  const handleSaveAndInvoice = () => {
    const orderPayload = validateOrder();
    if (orderPayload && editableOrderItems) {
        saveAndInvoice({ orderPayload, editableOrderItems, buyerName });
    }
  };

  const handleCancelOrderChanges = () => {
    setEditableOrderItems(result?.extracted ? JSON.parse(JSON.stringify(result.extracted)) : []);
    setBuyerName(result?.customer_name || '');
    toast({ title: 'Đã hoàn tác', description: 'Các thay đổi trong đơn hàng đã được hoàn tác.' });
  };
  
  const isProcessing = isTranscribing || isSaving || isInvoicing;

  const getRecorderStateDetails = () => {
    switch (recordingState) {
      case 'recording':
        return { title: 'Đang ghi âm...', description: `Thời gian còn lại: ${countdown}s`, icon: <Square className="h-10 w-10 sm:h-12 sm:w-12" /> };
      case 'permission_pending':
        return { title: 'Yêu cầu quyền...', description: 'Vui lòng cho phép truy cập microphone.', icon: <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin" /> };
      case 'processing':
        return { title: 'Đang xử lý...', description: 'Vui lòng chờ trong giây lát.', icon: <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin" /> };
      case 'transcribed':
        return { title: 'Ghi âm lại?', description: 'Nhấn vào micro để bắt đầu ghi âm mới.', icon: <Mic className="h-10 w-10 sm:h-12 sm:w-12" /> };
      case 'error':
        return { title: 'Gặp lỗi', description: 'Nhấn để thử lại.', icon: <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12" /> };
      case 'idle':
      default:
        return { title: 'Sẵn sàng ghi âm', description: 'Nhấn vào micro để bắt đầu ghi âm', icon: <Mic className="h-10 w-10 sm:h-12 sm:w-12" /> };
    }
  };
  
  const { title, description, icon } = getRecorderStateDetails();

  return (
    <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border">
            <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                    {recordingState === 'idle' && (
                        <span className="absolute inline-flex h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-primary/20 opacity-75 animate-ping"></span>
                    )}
                    <Button
                        onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
                        disabled={isProcessing || recordingState === 'permission_pending'}
                        className={cn(
                            "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full text-white text-lg p-4 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl",
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

        <Card className="w-full shadow-lg rounded-xl overflow-hidden border">
            <CardContent className="p-4 sm:p-6">
                {!result && !isProcessing && recordingState !== 'error' && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 py-8 sm:py-12">
                        <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed">
                             <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                        </div>
                        <p className="text-base sm:text-lg">Chưa có bản ghi nào</p>
                    </div>
                )}
                 {isProcessing && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 py-8 sm:py-12">
                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                        <p className="text-base sm:text-lg">Đang phân tích âm thanh...</p>
                    </div>
                )}
                {recordingState === 'error' && !result && (
                  <div className="flex flex-col items-center justify-center text-center text-red-500 space-y-4 py-8 sm:py-12">
                       <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-red-500/50">
                           <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />
                       </div>
                       <p className="text-base sm:text-lg">Không thể xử lý âm thanh. Vui lòng thử lại.</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-6">
                    <div>
                        <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                        <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{result.transcription}</p>
                    </div>
                    
                    {editableOrderItems && editableOrderItems.length > 0 ? (
                      <div className="space-y-6">
                        <h3 className="font-semibold text-base border-t pt-6">Chỉnh Sửa Đơn Hàng</h3>
                        <div className="space-y-2">
                           <Label htmlFor="buyerName" className="flex items-center text-sm font-medium"><User className="mr-2 h-4 w-4" />Tên người mua</Label>
                           <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nhập tên người mua hàng" className="text-sm" />
                        </div>
                        <div className="space-y-4">
                          {editableOrderItems.map((item, idx) => (
                            <div key={idx} className="border p-4 rounded-lg shadow-sm bg-gray-50 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><Label htmlFor={`ten_${idx}`} className="flex items-center text-sm font-medium"><Package className="mr-2 h-4 w-4"/>Tên hàng hóa</Label><Input id={`ten_${idx}`} value={item.ten_hang_hoa} onChange={(e) => handleOrderItemChange(idx, 'ten_hang_hoa', e.target.value)} /></div>
                                <div><Label htmlFor={`sl_${idx}`} className="flex items-center text-sm font-medium"><Tag className="mr-2 h-4 w-4"/>Số lượng</Label><Input id={`sl_${idx}`} type="number" value={String(item.so_luong ?? '')} onChange={(e) => handleOrderItemChange(idx, 'so_luong', e.target.value)} /></div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`dg_${idx}`} className="flex items-center text-sm font-medium"><CircleDollarSign className="mr-2 h-4 w-4"/>Đơn giá (VND)</Label>
                                  <Input id={`dg_${idx}`} type="number" value={String(item.don_gia ?? '')} onChange={(e) => handleOrderItemChange(idx, 'don_gia', e.target.value)} />
                                  {item.don_gia != null && (
                                    <p className="text-xs text-muted-foreground mt-1 text-right">{formatCurrency(item.don_gia)}</p>
                                  )}
                                </div>
                                <div><Label htmlFor={`vat_${idx}`} className="flex items-center text-sm font-medium"><Percent className="mr-2 h-4 w-4"/>Thuế GTGT (%)</Label><Input id={`vat_${idx}`} type="number" value={String(item.vat ?? '')} onChange={(e) => handleOrderItemChange(idx, 'vat', e.target.value)} placeholder="Ví dụ: 10" /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 mt-6 border-t-2 border-dashed">
                          <div className="space-y-2 mb-6 text-sm">
                              <div className="flex justify-between"><span>Tổng tiền hàng (trước thuế):</span><span className="font-semibold">{orderTotals.totalBeforeVat.toLocaleString('vi-VN')} VND</span></div>
                              <div className="flex justify-between"><span>Tổng tiền thuế GTGT:</span><span className="font-semibold">{orderTotals.totalVatAmount.toLocaleString('vi-VN')} VND</span></div>
                              <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t"><span>Tổng cộng thanh toán:</span><span>{orderTotals.totalAfterVat.toLocaleString('vi-VN')} VND</span></div>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <Button variant="outline" onClick={handleCancelOrderChanges} disabled={isProcessing} className="w-full sm:w-auto"><RotateCcw className="mr-2 h-4 w-4" />Hoàn tác</Button>
                            <Button onClick={handleSaveOnly} disabled={isProcessing} className="w-full sm:w-auto">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu đơn hàng</Button>
                            <Button onClick={handleSaveAndInvoice} disabled={isProcessing} className="font-semibold w-full sm:w-auto">{isInvoicing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Lưu & Xuất hoá đơn</Button>
                          </div>
                        </div>
                      </div>
                    ) : <p className="text-center text-muted-foreground py-8">Không có thông tin đơn hàng trong bản ghi.</p>}
                     {audioBlob && (
                      <div className="border-t pt-6 mt-6">
                        <Label className="font-semibold text-base">Âm thanh gốc</Label>
                        <audio controls src={URL.createObjectURL(audioBlob)} className="w-full mt-2" />
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
