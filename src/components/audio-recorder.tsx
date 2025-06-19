
'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, AlertTriangle, FileText, UploadCloud, RotateCcw, CheckCircle, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

// Type of the transcription API response
interface TranscriptionResponse {
  language: string;
  transcription: string;
  extracted: {
    ten_hang_hoa: string;
    so_luong: number;
    don_gia: number;
  }[];
}

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'transcribed' | 'error';

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [editableOrderItems, setEditableOrderItems] = useState<TranscriptionResponse['extracted'] | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

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

  const handleStartRecording = async () => {
    setResult(null);
    setAudioBlob(null);
    setEditableOrderItems(null);
    setRecordingState('permission_pending');
    setCountdown(0);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);


    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingState('recording');
      toast({ title: 'Bắt đầu ghi âm', description: 'Microphone đang hoạt động.', duration: 3000 });

      audioChunksRef.current = [];
      const recorderOptions = { mimeType: 'audio/webm;codecs=opus' };
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported(recorderOptions.mimeType)) {
        recorder = new MediaRecorder(streamRef.current, recorderOptions);
      } else {
        // Fallback or error if specific codec isn't supported
        console.warn(`${recorderOptions.mimeType} is not supported, falling back to default.`);
        recorder = new MediaRecorder(streamRef.current);
      }
      mediaRecorderRef.current = recorder;


      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stopMediaStream();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (audioChunksRef.current.length === 0) {
            console.warn("No audio data recorded.");
            setRecordingState('error');
            toast({ title: 'Lỗi Ghi Âm', description: 'Không có dữ liệu âm thanh được ghi lại. Vui lòng thử lại.', variant: 'destructive' });
            return;
        }
        const completeBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        setAudioBlob(completeBlob);
        setRecordingState('processing');
        await uploadAudio(completeBlob);
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({ title: 'Lỗi Ghi Âm', description: 'Gặp sự cố với thiết bị ghi âm.', variant: 'destructive' });
        setRecordingState('error');
        stopMediaStream();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };

      recorder.start();
      startCountdown();
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({ title: 'Lỗi Microphone', description: 'Không thể truy cập microphone.', variant: 'destructive' });
      setRecordingState('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(0);
  };

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    try {
      const response = await axios.post<TranscriptionResponse>('https://order-voice.appmkt.vn/transcribe/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      setEditableOrderItems(response.data.extracted ? JSON.parse(JSON.stringify(response.data.extracted)) : null);
      setRecordingState('transcribed');
      toast({ title: 'Chuyển đổi hoàn tất', description: 'Âm thanh đã được chuyển đổi thành công.' });
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể chuyển đổi âm thanh.';
      toast({ title: 'Lỗi Tải Lên', description: errorMessage, variant: 'destructive' });
      setRecordingState('error');
    }
  };
  
  const handleOrderItemChange = (
    itemIndex: number,
    field: keyof TranscriptionResponse['extracted'][0],
    value: string
  ) => {
    if (!editableOrderItems) return;

    const updatedItems = editableOrderItems.map((item, idx) => {
      if (idx === itemIndex) {
        let processedValue: string | number = value;
        if (field === 'so_luong' || field === 'don_gia') {
          processedValue = parseFloat(value); // Keeps as number, NaN if invalid
          if (isNaN(processedValue as number)) {
            processedValue = field === 'so_luong' ? item.so_luong : item.don_gia; // Revert to old value on NaN
          }
        }
        return { ...item, [field]: processedValue };
      }
      return item;
    });
    setEditableOrderItems(updatedItems);
  };

  const handleConfirmOrder = () => {
    console.log('Confirmed Order:', editableOrderItems);
    toast({ title: 'Đơn hàng đã xác nhận', description: 'Chi tiết đơn hàng đã được ghi lại (console).' });
    // Add logic to send editableOrderItems to an API if needed
  };

  const handleCancelOrderChanges = () => {
    if (result && result.extracted) {
      setEditableOrderItems(JSON.parse(JSON.stringify(result.extracted)));
      toast({ title: 'Đã hoàn tác', description: 'Các thay đổi trong đơn hàng đã được hoàn tác.' });
    } else {
      setEditableOrderItems(null);
      toast({ title: 'Đã hoàn tác', description: 'Không có dữ liệu gốc để hoàn tác.' });
    }
  };


  const getButtonIcon = () => {
    if (recordingState === 'recording') return <Mic className="h-6 w-6 animate-mic-active" />;
    if (recordingState === 'processing' || recordingState === 'permission_pending') return <Loader2 className="h-6 w-6 animate-spin" />;
    return <Mic className="h-6 w-6" />;
  };
  
  const getButtonAriaLabel = () => {
    if (recordingState === 'recording') return `Dừng ghi âm (còn ${countdown}s)`;
    if (recordingState === 'permission_pending') return 'Đang yêu cầu quyền Microphone...';
    if (recordingState === 'processing') return 'Đang chuyển đổi...';
    return 'Bắt đầu ghi âm';
  }

  return (
    <Card className="w-full shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-card border-b border-border">
        <CardTitle className="flex items-center text-2xl font-headline text-primary">
          {/* <UploadCloud className="mr-3 h-7 w-7" /> Ghi Âm Thanh */}
          Tạo hoá đơn
        </CardTitle>
        {/* <CardDescription>
          Nhấn nút micro để bắt đầu ghi âm. Thời gian tối đa: {MAX_RECORDING_TIME_SECONDS} giây.
          {recordingState === 'recording' && ` Thời gian còn lại: ${countdown}s`}
        </CardDescription> */}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
            disabled={recordingState === 'processing' || recordingState === 'permission_pending'}
            className={`w-20 h-20 rounded-full text-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 focus:ring-4 focus:ring-offset-2 focus:ring-accent/50
              ${recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}
              ${(recordingState === 'processing' || recordingState === 'permission_pending') ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
            `}
            aria-label={getButtonAriaLabel()}
            variant={recordingState === 'recording' ? 'destructive' : 'default'}
          >
            {getButtonIcon()}
          </Button>

          {recordingState === 'recording' && (
            <div className="w-full max-w-xs mt-3">
              <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="h-2.5 rounded-full [&>div]:bg-red-500" />
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6 pt-6 border-t border-border">
            <Card className="bg-secondary/20 border-secondary shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline text-foreground">
                  <FileText className="mr-2 h-6 w-6 text-primary" /> Bản Ghi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed whitespace-pre-wrap p-4 bg-background rounded-md shadow-inner">
                  {result.transcription}
                </p>
              </CardContent>
            </Card>
            
            {editableOrderItems && editableOrderItems.length > 0 ? (
              <Card className="bg-background border-muted shadow-md rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center text-foreground">
                    <ShoppingBag className="mr-2 h-6 w-6 text-primary" />
                    Đơn Hàng (Có thể chỉnh sửa)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editableOrderItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="border p-4 rounded-md shadow-sm bg-secondary/10 space-y-3">
                      <div>
                        <Label htmlFor={`ten_hang_hoa_${itemIndex}`} className="text-sm font-medium text-foreground/80">Tên hàng hóa</Label>
                        <Input
                          id={`ten_hang_hoa_${itemIndex}`}
                          value={item.ten_hang_hoa}
                          onChange={(e) => handleOrderItemChange(itemIndex, 'ten_hang_hoa', e.target.value)}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`so_luong_${itemIndex}`} className="text-sm font-medium text-foreground/80">Số lượng</Label>
                        <Input
                          id={`so_luong_${itemIndex}`}
                          type="number"
                          value={item.so_luong.toString()} // Input type number expects string value
                          onChange={(e) => handleOrderItemChange(itemIndex, 'so_luong', e.target.value)}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`don_gia_${itemIndex}`} className="text-sm font-medium text-foreground/80">Đơn giá (VND)</Label>
                        <Input
                          id={`don_gia_${itemIndex}`}
                          type="number"
                          value={item.don_gia.toString()} // Input type number expects string value
                          onChange={(e) => handleOrderItemChange(itemIndex, 'don_gia', e.target.value)}
                          className="mt-1 bg-white"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Giá trị hiển thị: {Number(item.don_gia).toLocaleString()} VND</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-4">
                    <Button variant="outline" onClick={handleCancelOrderChanges} className="shadow-sm hover:bg-muted/50">
                      <RotateCcw className="mr-2 h-4 w-4" /> Hoàn tác
                    </Button>
                    <Button onClick={handleConfirmOrder} className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                      <CheckCircle className="mr-2 h-4 w-4" /> Xác nhận đơn hàng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-background border-muted shadow-md rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-headline flex items-center text-foreground">
                     <ShoppingBag className="mr-2 h-6 w-6 text-primary" />
                     Đơn Hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {result.extracted === null || result.extracted === undefined
                      ? 'Thông tin đơn hàng không có sẵn từ bản ghi.'
                      : 'Không có mặt hàng nào được trích xuất từ bản ghi.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {recordingState === 'error' && !result && (
          <Card className="bg-destructive/10 border-destructive mt-6 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-destructive-foreground">
                <AlertTriangle className="mr-2 h-6 w-6" /> Lỗi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive-foreground">Không thể xử lý âm thanh. Vui lòng thử lại.</p>
            </CardContent>
          </Card>
        )}
      </CardContent>

      <CardFooter className="flex justify-center p-4 border-t border-border">
        {audioBlob && recordingState !== 'processing' && (
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" aria-label="Recorded audio player" />
        )}
      </CardFooter>
    </Card>
  );
}
