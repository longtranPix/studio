
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      : null;
    setResult({ ...data, extracted: processedExtracted });
    setBuyerName(data.customer_name || '');
    setEditableOrderItems(processedExtracted ? JSON.parse(JSON.stringify(processedExtracted)) : null);
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
    setEditableOrderItems(result?.extracted ? JSON.parse(JSON.stringify(result.extracted)) : null);
    setBuyerName('');
    toast({ title: 'Đã hoàn tác', description: 'Các thay đổi trong đơn hàng đã được hoàn tác.' });
  };
  
  const isProcessing = isTranscribing || isSaving || isInvoicing;

  const getButtonState = () => {
    if (isProcessing || recordingState === 'permission_pending' || recordingState === 'processing') {
      return {
        disabled: true,
        icon: <Loader2 className="h-10 w-10 animate-spin" />,
        label: "Đang xử lý...",
        className: "bg-gray-500"
      };
    }
    if (recordingState === 'recording') {
      return {
        disabled: false,
        icon: <Square className="h-10 w-10" />,
        label: `Dừng ghi âm`,
        className: "bg-red-500 hover:bg-red-600"
      };
    }
    return {
      disabled: false,
      icon: <Mic className="h-10 w-10" />,
      label: "Bắt đầu ghi âm",
      className: "bg-primary hover:bg-primary/90"
    };
  };
  
  const buttonState = getButtonState();

  return (
    <Card className="w-full shadow-xl rounded-xl overflow-hidden border border-border/30">
      <CardHeader className="text-center bg-card">
        <CardTitle className="flex items-center justify-center text-3xl font-headline text-primary">Tạo hoá đơn nhanh</CardTitle>
        <CardDescription>Nhấn nút micro để ghi âm (tối đa {MAX_RECORDING_TIME_SECONDS} giây).</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20">
                 <span
                    className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75 animate-spread-ping",
                        recordingState === 'recording' ? "bg-red-500" : "bg-primary"
                    )}
                />
                 <span
                    className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75 animate-spread-ping [animation-delay:750ms]",
                        recordingState === 'recording' ? "bg-red-500" : "bg-primary"
                    )}
                />
                <Button
                    onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
                    disabled={buttonState.disabled}
                    className={`relative w-full h-full rounded-full text-lg p-4 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg ${buttonState.className}`}
                    aria-label={buttonState.label}
                >
                    {buttonState.icon}
                </Button>
            </div>
            {recordingState === 'recording' && (
              <div className="w-full max-w-sm text-center">
                 <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="mt-3 h-2 rounded-full [&>div]:bg-red-500" />
                 <p className="text-lg text-red-500 font-mono mt-2">{countdown}s</p>
              </div>
            )}
        </div>

        {result && (
          <div className="space-y-6 pt-6 border-t animate-fade-in-up">
            <Card className="bg-secondary/50 shadow-md border-border/30">
              <CardHeader><CardTitle className="flex items-center text-primary"><FileText className="mr-3 h-6 w-6" />Bản Ghi Âm</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap p-4 bg-background rounded-md shadow-inner text-base">{result.transcription}</p></CardContent>
            </Card>
            
            {editableOrderItems && editableOrderItems.length > 0 ? (
              <Card className="border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary"><Pen className="mr-3 h-6 w-6"/>Chỉnh Sửa Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                     <Label htmlFor="buyerName" className="flex items-center text-base"><User className="mr-2 h-5 w-5" />Tên người mua</Label>
                     <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nhập tên người mua hàng" className="text-base" />
                  </div>
                  <div className="space-y-4">
                    {editableOrderItems.map((item, idx) => (
                      <div key={idx} className="border p-4 rounded-lg shadow-sm bg-secondary/30 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div><Label htmlFor={`ten_${idx}`} className="flex items-center"><Package className="mr-2 h-4 w-4"/>Tên hàng hóa</Label><Input id={`ten_${idx}`} value={item.ten_hang_hoa} onChange={(e) => handleOrderItemChange(idx, 'ten_hang_hoa', e.target.value)} /></div>
                          <div><Label htmlFor={`sl_${idx}`} className="flex items-center"><Tag className="mr-2 h-4 w-4"/>Số lượng</Label><Input id={`sl_${idx}`} type="number" value={String(item.so_luong ?? '')} onChange={(e) => handleOrderItemChange(idx, 'so_luong', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`dg_${idx}`} className="flex items-center"><CircleDollarSign className="mr-2 h-4 w-4"/>Đơn giá (VND)</Label>
                            <Input id={`dg_${idx}`} type="number" value={String(item.don_gia ?? '')} onChange={(e) => handleOrderItemChange(idx, 'don_gia', e.target.value)} />
                            <p className="text-xs text-muted-foreground mt-1">Giá trị: {Number(item.don_gia ?? 0).toLocaleString()} VND</p>
                          </div>
                          <div><Label htmlFor={`vat_${idx}`} className="flex items-center"><Percent className="mr-2 h-4 w-4"/>Thuế GTGT (%)</Label><Input id={`vat_${idx}`} type="number" value={String(item.vat ?? '')} onChange={(e) => handleOrderItemChange(idx, 'vat', e.target.value)} placeholder="Ví dụ: 10" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 mt-6 border-t-2 border-dashed">
                    <div className="space-y-2 mb-6 text-base">
                        <div className="flex justify-between"><span>Tổng tiền hàng (trước thuế):</span><span className="font-semibold">{orderTotals.totalBeforeVat.toLocaleString('vi-VN')} VND</span></div>
                        <div className="flex justify-between"><span>Tổng tiền thuế GTGT:</span><span className="font-semibold">{orderTotals.totalVatAmount.toLocaleString('vi-VN')} VND</span></div>
                        <div className="flex justify-between text-xl font-bold text-primary mt-2 pt-2 border-t"><span>Tổng cộng thanh toán:</span><span>{orderTotals.totalAfterVat.toLocaleString('vi-VN')} VND</span></div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button variant="outline" onClick={handleCancelOrderChanges} disabled={isProcessing}><RotateCcw className="mr-2 h-4 w-4" />Hoàn tác</Button>
                      <Button onClick={handleSaveOnly} disabled={isProcessing}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu đơn hàng</Button>
                      <Button onClick={handleSaveAndInvoice} disabled={isProcessing} className="font-semibold">{isInvoicing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Lưu & Xuất hoá đơn</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : <p className="text-center text-muted-foreground py-8">Không có thông tin đơn hàng.</p>}
          </div>
        )}
        {recordingState === 'error' && !result && (
          <Card className="bg-destructive/10 border-destructive mt-6"><CardHeader><CardTitle className="flex items-center text-destructive-foreground"><AlertTriangle className="mr-2 h-6 w-6" />Lỗi</CardTitle></CardHeader><CardContent><p className="text-destructive-foreground">Không thể xử lý âm thanh. Vui lòng thử lại.</p></CardContent></Card>
        )}
      </CardContent>
      <CardFooter className="flex justify-center p-4 border-t bg-secondary/30">
        {audioBlob && recordingState !== 'processing' && !isProcessing && (<audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />)}
      </CardFooter>
    </Card>
  );
}
