// src/components/audio-recorder.tsx
'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Mic, Loader2, AlertTriangle, Square, X, Info, Coins, AlertCircle, Zap, Box, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import type { TranscriptionResponse, ProcessedAudioResponse, ProductData, ImportSlipData } from '@/types/order';
import { useTranscribeAudio } from '@/hooks/use-orders';
import { OrderForm } from '@/components/home/order-form';
import { ProductForm } from '@/components/home/product-form';
import { ImportSlipForm } from '@/components/home/import-slip-form';
import { useAuthStore } from '@/store/auth-store';
import { useRecordingStore } from '@/store/recording-store';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const SoundWave = () => (
    <div className="flex items-center justify-center space-x-1 w-16 h-16">
        {[0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
            <div
                key={i}
                className="w-2 rounded-full bg-primary/30"
                style={{
                    animation: `sound-wave-color 1.2s infinite ease-in-out`,
                    animationDelay: `${delay}s`,
                    height: `${20 + (i % 2 === 0 ? i * 2 : (5 - i) * 2)}px`
                }}
            />
        ))}
    </div>
);

const HintCard = () => {
    const hints = [
        {
            title: "Tạo Đơn Hàng",
            example: `"Anh Long, 5 lốc bia Tiger, 2 thùng mì Hảo Hảo."`,
            icon: Zap,
            color: "text-green-500",
        },
        {
            title: "Tạo Hàng Hóa",
            example: `"Tạo hàng hóa Sting; chai giá 10, lốc 6 chai 58, thùng 24 chai 230."`,
            icon: Box,
            color: "text-blue-500",
        },
        {
            title: "Nhập Kho",
            example: `"Nhập kho Tân Hiệp Phát; 50 thùng Hảo Hảo giá 150, 100 thùng La Vie giá 80."`,
            icon: Truck,
            color: "text-orange-500",
        },
    ];

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up mt-6">
             <CardHeader>
                <CardTitle className="text-lg">Gợi ý câu lệnh</CardTitle>
                <CardDescription>Bắt đầu với một trong các mẫu sau:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {hints.map((hint, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <hint.icon className={`h-6 w-6 mt-1 flex-shrink-0 ${hint.color}`} />
                        <div className="flex-grow">
                            <p className="font-semibold">{hint.title}</p>
                            <code className="text-sm text-muted-foreground not-italic">{hint.example}</code>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


const AudioRecorder = () => {
  const {
    recordingState,
    setRecordingState,
    countdown,
    setCountdown,
    transcription,
    setTranscription,
    formMode,
    setFormMode,
    orderData,
    setOrderData,
    productData,
    setProductData,
    importSlipData,
    setImportSlipData,
    reset: resetRecordingStore,
  } = useRecordingStore();
  
  const { planStatus } = useAuthStore();
  const isPlanActive = planStatus === 'active';
  const [showHint, setShowHint] = useState(true);

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
      resetRecordingStore();
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
  };
  
  useEffect(() => {
    const { start, stop } = useRecordingStore.getState().controls;
    if (start) {
        handleStartRecording();
        useRecordingStore.setState({ controls: { start: false, stop: false } });
    }
    if (stop) {
        handleStopRecording();
        useRecordingStore.setState({ controls: { start: false, stop: false } });
    }
  }, [useRecordingStore.getState().controls.start, useRecordingStore.getState().controls.stop]);


  const getRecorderStateDetails = () => {
    if (!isPlanActive) {
      return { title: 'Gói dịch vụ đã hết hạn', description: 'Vui lòng gia hạn để tiếp tục sử dụng.' };
    }
    switch (recordingState) {
      case 'recording':
        return { title: 'Đang ghi âm...', description: `Thời gian còn lại: ${countdown}s` };
      case 'permission_pending':
        return { title: 'Yêu cầu quyền...', description: 'Vui lòng cho phép truy cập microphone.' };
      case 'processing':
        return { title: 'Đang xử lý âm thanh...', description: 'Vui lòng chờ trong giây lát.' };
      case 'processed':
        return { title: 'Đã xử lý xong', description: 'Kiểm tra và xác nhận thông tin bên dưới.' };
      case 'error':
        return { title: 'Gặp lỗi', description: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
      case 'idle':
      default:
        return { title: 'Sẵn sàng ghi âm', description: 'Nhấn vào micro ở thanh điều hướng để bắt đầu.' };
    }
  };

  const { title, description } = getRecorderStateDetails();

  const showForm = (recordingState === 'processed' || (recordingState === 'error' && transcription));

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

      {recordingState === 'idle' && !showForm && (
        <div className="text-center py-10 relative">
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <div className="flex justify-center items-center gap-2 mt-2">
            <p className="text-muted-foreground">{description}</p>
            <button onClick={() => setShowHint(!showHint)} className="text-muted-foreground hover:text-primary">
                <Info className="h-5 w-5" />
            </button>
          </div>
          {showHint && <HintCard />}
        </div>
      )}

      {recordingState === 'permission_pending' && (
        <div className="text-center py-10 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      )}
      
      {recordingState === 'recording' && (
        <div className="text-center py-10 flex flex-col items-center">
            <SoundWave />
            <h1 className="text-2xl sm:text-3xl font-bold mt-4">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
            <div className="w-full max-w-sm pt-4">
                <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="h-2 rounded-full [&>div]:bg-red-500" />
            </div>
        </div>
      )}

      {recordingState === 'processing' && (
        <div className="text-center py-10 flex flex-col items-center">
            <SoundWave />
            <h1 className="text-2xl sm:text-3xl font-bold mt-4">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      )}
      
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
                  <CardHeader>
                    <CardTitle>Không nhận dạng được yêu cầu</CardTitle>
                    <CardDescription>AI không thể xác định yêu cầu của bạn là tạo đơn hàng, sản phẩm hay nhập kho. Vui lòng thử lại.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                      <p className="font-semibold text-base">Bản Ghi Âm</p>
                      <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 dark:bg-gray-800/50 rounded-md shadow-inner text-sm">{transcription}</p>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-4">
                      <Button onClick={resetAll}><Mic className="mr-2"/>Thử lại</Button>
                  </CardFooter>
              </Card>
           )}
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
