// src/components/image-capture.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Loader2, AlertTriangle, Upload, Zap, Box, Truck, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRecordingStore } from '@/store/recording-store';
import type { ProcessedImageOutput } from '@/types/order';
import axios from 'axios';
import { OrderForm } from '@/components/home/order-form';
import { ProductForm } from '@/components/home/product-form';
import { ImportSlipForm } from '@/components/home/import-slip-form';

type CaptureState = 'idle' | 'permission_pending' | 'capturing' | 'preview' | 'processing' | 'processed' | 'error';
type Intent = 'create_product' | 'create_import_slip' | 'create_invoice';

export default function ImageCapture() {
    const { toast } = useToast();
    const { reset: resetRecordingStore } = useRecordingStore();
    
    const [captureState, setCaptureState] = useState<CaptureState>('idle');
    const [hasPermission, setHasPermission] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedImageOutput | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopMediaStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };
    
    const startCamera = async () => {
        if (streamRef.current) stopMediaStream(); // Stop any existing stream
        
        setCaptureState('permission_pending');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermission(true);
            setCaptureState('capturing');
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasPermission(false);
            setCaptureState('error');
            toast({
                variant: 'destructive',
                title: 'Lỗi truy cập máy ảnh',
                description: 'Vui lòng cấp quyền truy cập máy ảnh trong cài đặt trình duyệt của bạn.',
            });
        }
    };
    
    useEffect(() => {
        startCamera();
        // Cleanup function to stop the stream when the component unmounts
        return () => {
            stopMediaStream();
        };
    }, []);


    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUri);
            setCaptureState('preview');
            stopMediaStream();
        }
    };

    const processWithIntent = async (intent: Intent) => {
        if (!capturedImage) return;
        setCaptureState('processing');
        try {
            const { data } = await axios.post('/api/process-image', {
                imageDataUri: capturedImage,
                intent: intent,
            });
            setProcessedData(data);
            setCaptureState('processed');
            toast({ title: 'Xử lý ảnh thành công!', description: 'Kiểm tra thông tin được điền vào form.' });
        } catch (error) {
            console.error("Image processing error", error);
            setCaptureState('error');
            toast({ title: 'Lỗi xử lý ảnh', description: 'Không thể phân tích hình ảnh. Vui lòng thử lại.', variant: 'destructive' });
        }
    };

    const resetAll = () => {
        resetRecordingStore();
        setCaptureState('idle');
        setCapturedImage(null);
        setProcessedData(null);
        startCamera(); // Restart camera after reset
    };

    const renderContent = () => {
        if (captureState === 'processed' && processedData) {
            switch(processedData.intent) {
                case 'create_product':
                    return <ProductForm initialData={processedData.product_data} onCancel={resetAll} transcription={processedData.transcription} />;
                case 'create_import_slip':
                    return <ImportSlipForm initialData={processedData.import_slip_data} onCancel={resetAll} transcription={processedData.transcription} />;
                case 'create_invoice':
                    return <OrderForm initialData={processedData.invoice_data} onCancel={resetAll} />;
                default:
                    setCaptureState('error');
                    return null;
            }
        }
        
        return (
            <Card className="w-full max-w-lg mx-auto shadow-lg animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera /> Chụp Ảnh Sản Phẩm
                    </CardTitle>
                    <CardDescription>
                        {captureState === 'permission_pending' && 'Vui lòng cấp quyền truy cập máy ảnh...'}
                        {captureState === 'capturing' && 'Căn chỉnh sản phẩm và nhấn nút chụp.'}
                        {captureState === 'preview' && 'Chọn một hành động để AI xử lý ảnh.'}
                        {captureState === 'processing' && 'AI đang phân tích hình ảnh...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                        {/* Always render video and canvas, but control visibility */}
                        <video 
                            ref={videoRef} 
                            className={`w-full h-full object-cover ${captureState === 'capturing' ? 'block' : 'hidden'}`} 
                            autoPlay 
                            muted 
                            playsInline 
                        />
                         {captureState === 'preview' && capturedImage && (
                            <img src={capturedImage} alt="Captured product" className="w-full h-full object-contain" />
                         )}

                        {captureState === 'permission_pending' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                        {captureState === 'processing' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                        {captureState === 'error' && <AlertTriangle className="h-12 w-12 text-destructive" />}
                        {captureState === 'idle' && <Camera className="h-12 w-12 text-muted-foreground" />}
                    </div>
                    
                    {captureState === 'capturing' && (
                        <Button size="lg" className="w-full mt-4" onClick={handleCapture}>
                            <Camera className="mr-2" /> Chụp
                        </Button>
                    )}

                    {captureState === 'preview' && (
                        <div className="mt-4 space-y-3">
                           <div className="flex items-center justify-center">
                             <Button variant="outline" size="sm" onClick={() => startCamera()}>
                               <RefreshCw className="mr-2 h-4 w-4" /> Chụp lại
                             </Button>
                           </div>
                            <p className="text-center text-sm font-medium text-muted-foreground">Chọn hành động bạn muốn thực hiện:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Button onClick={() => processWithIntent('create_product')}><Box className="mr-2 h-4 w-4"/> Tạo sản phẩm</Button>
                                <Button onClick={() => processWithIntent('create_import_slip')}><Truck className="mr-2 h-4 w-4"/> Nhập hàng</Button>
                                <Button onClick={() => processWithIntent('create_invoice')}><Zap className="mr-2 h-4 w-4"/> Lên đơn</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
                <canvas ref={canvasRef} className="hidden" />
            </Card>
        );
    }
    
    return <div className="w-full max-w-4xl space-y-6">{renderContent()}</div>;
}
