
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Loader2, AlertTriangle, Square, X, Info, Coins, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import type { TranscriptionResponse, ProcessedAudioResponse, ProductData, ImportSlipData } from '@/types/order';
import { useTranscribeAudio } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { OrderForm } from '@/components/home/order-form';
import { ProductForm } from '@/components/home/product-form';
import { ImportSlipForm } from '@/components/home/import-slip-form';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'processed' | 'error';
type FormMode = 'order' | 'product' | 'import_slip' | 'none';

const SoundWave = () => (
    <div className="flex items-center justify-center space-x-1 w-16 h-16">
        {[0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
            <div
                key={i}
                className="w-2 rounded-full bg-primary/30"
                style={{
                    animation: `sound-wave-color 1.2s infinite ease-in-out`,
                    animationDelay: `${delay}s`,
                    height: `${20 + (i % 2 === 0 ? i * 2 : (5 - i) * 2)}px` // Varying heights
                }}
            />
        ))}
    </div>
);


export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [showHint, setShowHint] = useState(true);
  
  const [orderData, setOrderData] = useState<TranscriptionResponse | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [importSlipData, setImportSlipData] = useState<ImportSlipData | null>(null);

  const { creditValue, planStatus } = useAuthStore();

  const isPlanActive = planStatus === 'active';

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

  const toggleHint = () => {
    setShowHint(prev => !prev);
  };

  const { mutate: transcribe, isPending: isTranscribing } = useTranscribeAudio(
    (data: ProcessedAudioResponse) => {
      setRecordingState('processed');
      setTranscription(data.transcription);
      
      if (data.intent === 'create_invoice' && data.invoice_data) {
        setFormMode('order');
        setOrderData(data.invoice_data);
        toast({ title: 'Chuyển đổi hoàn tất', description: 'Đã nhận dạng yêu cầu tạo hoá đơn.' });
      } else if (data.intent === 'create_product' && data.product_data) {
        setFormMode('product');
        setProductData(data.product_data);
        toast({ title: 'Chuyển đổi hoàn tất', description: 'Đã nhận dạng yêu cầu tạo hàng hoá.' });
      } else if (data.intent === 'create_import_slip' && data.import_slip_data) {
        setFormMode('import_slip');
        setImportSlipData(data.import_slip_data);
        toast({ title: 'Chuyển đổi hoàn tất', description: 'Đã nhận dạng yêu cầu nhập kho.' });
      }
      else {
        setFormMode('none');
        toast({ title: 'Không nhận dạng được yêu cầu', description: 'Vui lòng thử lại với yêu cầu tạo đơn hàng, tạo hàng hoá hoặc nhập kho.', variant: 'destructive' });
      }
    },
    () => {
      setRecordingState('error');
    }
  );

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
    setImportSlipData(null);
    setAudioBlob(null);
    setRecordingState('idle');
    setFormMode('none');
    setTranscription('');
  };

  const handleStartRecording = async () => {
    if (!isPlanActive) {
      toast({
        title: "Gói dịch vụ không hoạt động",
        description: "Vui lòng gia hạn gói để tiếp tục sử dụng.",
        variant: "destructive"
      });
      return;
    }
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

  const getRecorderStateDetails = () => {
    if (!isPlanActive) {
      return { title: 'Gói dịch vụ đã hết hạn', description: 'Vui lòng gia hạn để tiếp tục sử dụng.', icon: <Mic className="w-10 h-10 sm:w-16 sm:h-16" strokeWidth={1.3} /> };
    }
    switch (recordingState) {
      case 'recording':
        return { title: 'Đang ghi âm...', description: `Thời gian còn lại: ${countdown}s`, icon: <Square className="h-10 w-10 sm:h-12 sm:h-12" /> };
      case 'permission_pending':
        return { title: 'Yêu cầu quyền...', description: 'Vui lòng cho phép truy cập microphone.', icon: <Loader2 className="h-14 w-14 sm:h-16 sm:h-16 animate-spin" /> };
      case 'processing':
        return { title: 'Đang xử lý âm thanh...', description: 'Vui lòng chờ trong giây lát.', icon: <SoundWave /> };
      case 'processed':
        return { title: 'Ghi âm lại?', description: 'Nhấn vào micro để bắt đầu ghi âm mới.', icon: <Mic className="w-10 h-10 sm:w-16 sm:h-16" strokeWidth={1.3} /> };
      case 'error':
        return { title: 'Gặp lỗi', description: 'Nhấn để thử lại.', icon: <AlertTriangle className="h-14 w-14 sm:h-16 sm:h-16" /> };
      case 'idle':
      default:
        return { title: 'Sẵn sàng ghi âm', description: 'Nhấn vào micro để bắt đầu ghi âm', icon: <Mic className="w-10 h-10 sm:w-16 sm:h-16" strokeWidth={1.3} /> };
    }
  };

  const { title, description, icon } = getRecorderStateDetails();

  const showForm = (recordingState === 'processed' || (recordingState === 'error' && transcription));

  const formatCredit = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    return value.toLocaleString('de-DE');
  }

  return (
    <div className="w-full max-w-4xl space-y-6 animate-fade-in-up">
      {!isPlanActive && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gói dịch vụ không hoạt động</AlertTitle>
          <AlertDescription>
            Gói dịch vụ của bạn đã hết hạn hoặc bị tạm ngưng. Vui lòng{' '}
            <Link href="/account" className="font-semibold underline">
              gia hạn
            </Link>
            {' '}để tiếp tục sử dụng chức năng ghi âm.
          </AlertDescription>
        </Alert>
      )}
      <Card className="relative w-full shadow-lg rounded-xl overflow-hidden border">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            {creditValue !== null && (
                <Badge variant="outline" className="py-1 px-3 text-base bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-200">
                    <Coins className="h-4 w-4 mr-1.5"/>
                    <span className="font-semibold">{formatCredit(creditValue)}</span>
                </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={toggleHint} aria-label="Toggle hint">
                <Info className="h-5 w-5"/>
            </Button>
        </div>

        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4 text-center">
          <div className="relative flex items-center justify-center">
            {recordingState === 'idle' && isPlanActive && (
              <span className="absolute inline-flex h-24 sm:h-30 w-24 sm:w-30 rounded-full bg-primary/20 opacity-75 animate-ping"></span>
            )}
            <Button
              onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
              disabled={isTranscribing || recordingState === 'permission_pending' || !isPlanActive}
              className={cn(
                "relative w-24 h-24 sm:w-30 sm:w-30 rounded-full text-white flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xl",
                recordingState === 'recording' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90",
                recordingState === 'processing' && "bg-transparent hover:bg-transparent shadow-none",
                !isPlanActive && "bg-gray-400 dark:bg-gray-600 cursor-not-allowed hover:bg-gray-400"
              )}
              aria-label={title}
            >
              {icon}
            </Button>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-base text-muted-foreground">{description}</p>
          
          {showHint && (
            <div className="relative w-full max-w-md p-3 text-left bg-blue-50 border border-blue-200 rounded-lg shadow-sm animate-fade-in-up dark:bg-blue-900/30 dark:border-blue-700">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-blue-500" onClick={() => setShowHint(false)}>
                    <X className="h-4 w-4"/>
                    <span className="sr-only">Đóng</span>
                </Button>
                <p className="font-bold mb-2 text-sm text-blue-800 dark:text-blue-200">Gợi ý cách nói:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <li><strong className="text-primary">Tạo Đơn hàng:</strong> "Anh Long, 5 lốc Tiger, 2 thùng Hảo Hảo..."</li>
                    <li><strong className="text-primary">Tạo Hàng hóa:</strong> Bắt đầu bằng "Tạo hàng hóa..."</li>
                    <li><strong className="text-primary">Nhập Kho:</strong> Bắt đầu bằng "Nhập kho từ..."</li>
                </ul>
            </div>
          )}

          {recordingState === 'recording' && (
            <div className="w-full max-w-sm pt-2">
              <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="h-2 rounded-full [&>div]:bg-red-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <>
          {formMode === 'order' && orderData && (
            <OrderForm
              initialData={orderData}
              onCancel={resetAll}
            />
          )}
          {formMode === 'product' && (
              <ProductForm 
                initialData={productData}
                onCancel={resetAll}
                transcription={transcription}
              />
          )}
           {formMode === 'import_slip' && importSlipData && (
              <ImportSlipForm 
                initialData={importSlipData}
                onCancel={resetAll}
                transcription={transcription}
              />
          )}
           {formMode === 'none' && !isTranscribing && transcription && (
              <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                  <CardContent className="p-4 sm:p-6">
                      <p className="font-semibold text-base">Bản Ghi Âm</p>
                      <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{transcription}</p>
                  </CardContent>
              </Card>
           )}
        </>
      )}
    </div>
  );
}

    