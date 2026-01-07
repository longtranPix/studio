'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2, AlertTriangle, RefreshCw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalyzeImage, useSaveOrder, useSaveAndInvoice } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { OrderForm } from '@/components/home/order-form';
import type { ExtractedItem, TranscriptionResponse, CreateOrderPayload } from '@/types/order';
import { useRouter } from 'next/navigation';

type PhotoState = 'idle' | 'permission_pending' | 'viewing' | 'captured' | 'processing' | 'analyzed' | 'error';

export default function PhotoCapture() {
    const [photoState, setPhotoState] = useState<PhotoState>('idle');
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<TranscriptionResponse | null>(null);
    const [editableOrderItems, setEditableOrderItems] = useState<ExtractedItem[] | null>(null);
    const [buyerName, setBuyerName] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'CK' | 'TM'>('TM');
    const [isSaving, setIsSaving] = useState(false);
    const [isInvoicing, setIsInvoicing] = useState(false);

    const router = useRouter();
    const { mutate: saveOrder } = useSaveOrder();
    const { mutate: saveAndInvoice } = useSaveAndInvoice();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { toast } = useToast();

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);


    const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeImage(
        (data) => {
            const processedExtracted = data.extracted
                ? data.extracted.map(item => ({
                    ...item,
                    don_vi_tinh: item.don_vi_tinh ?? 'cái',
                    so_luong: item.so_luong ?? null,
                    don_gia: item.don_gia ?? null,
                    vat: item.vat ?? null,
                }))
                : [];
            setResult({ ...data, extracted: processedExtracted });
            setBuyerName(data.customer_name || '');
            setEditableOrderItems(processedExtracted ? JSON.parse(JSON.stringify(processedExtracted)) : []);
            setPhotoState('analyzed');
            toast({ title: 'Phân tích hoàn tất', description: 'Hình ảnh đã được xử lý thành công.', variant: 'success' });
        },
        () => {
            setPhotoState('error');
        }
    );

    const startCamera = useCallback(async () => {
        setPhotoState('permission_pending');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setPhotoState('viewing');
        } catch (err) {
            console.error('Camera access error:', err);
            setPhotoState('error');
            toast({ title: 'Lỗi Camera', description: 'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.', variant: 'destructive' });
        }
    }, [toast]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [stopCamera, startCamera]);


    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Get intrinsic dimensions of the video stream
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const videoAspect = videoWidth / videoHeight;

            // Get rendered dimensions of the video element (which matches the container's aspect ratio)
            const rect = video.getBoundingClientRect();
            const containerWidth = rect.width;
            const containerHeight = rect.height;
            const containerAspect = containerWidth / containerHeight;

            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = videoWidth;
            let sourceHeight = videoHeight;

            // Calculate cropping based on object-cover logic
            if (videoAspect > containerAspect) {
                // Video is wider than container - crop sides
                sourceWidth = videoHeight * containerAspect;
                sourceX = (videoWidth - sourceWidth) / 2;
            } else {
                // Video is taller than container - crop top/bottom
                sourceHeight = videoWidth / containerAspect;
                sourceY = (videoHeight - sourceHeight) / 2;
            }

            // Set canvas size to the desired output size (keeping container aspect)
            // We can scale it down if needed, but let's keep high quality
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;

            const context = canvas.getContext('2d');
            if (context) {
                // Draw only the visible portion of the video onto the canvas
                context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        setImageBlob(blob);
                        setPreviewUrl(URL.createObjectURL(blob));
                        setPhotoState('processing');
                        stopCamera();

                        // Automate analysis directly
                        const formData = new FormData();
                        formData.append('image', blob, 'capture.jpg');
                        analyze(formData);
                    }
                }, 'image/jpeg', 0.9); // Slightly higher quality
            }
        }
    };

    const handleRetake = () => {
        setPreviewUrl(null);
        setImageBlob(null);
        startCamera();
    };

    const handleUpload = () => {
        if (imageBlob) {
            const formData = new FormData();
            formData.append('image', imageBlob, 'capture.jpg');
            setPhotoState('processing');
            analyze(formData);
        }
    };

    const resetAll = () => {
        setResult(null);
        setImageBlob(null);
        setPreviewUrl(null);
        setEditableOrderItems(null);
        setBuyerName('');
        setPhotoState('idle');
        setPaymentMethod('TM');
        stopCamera();
    };

    const orderTotals = { totalBeforeVat: 0, totalVatAmount: 0, totalAfterVat: 0 }; // Simplified, OrderForm calculates its own or we re-use Logic

    // Re-use logic from AudioRecorder if possible, but for now let's keep it self-contained
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

    const generateOrderCode = (): string => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `DH${day}${month}${year}-${random}`;
    };

    const validateOrder = (): CreateOrderPayload | null => {
        if (!editableOrderItems || editableOrderItems.length === 0) {
            toast({ title: 'Lỗi Đơn Hàng', description: 'Không có mặt hàng nào để xử lý.', variant: 'destructive' }); return null;
        }

        const order_details = editableOrderItems.map(item => ({
            product_name: item.ten_hang_hoa || "Không có tên",
            unit_price: item.don_gia ?? 0,
            quantity: item.so_luong ?? 0,
            vat_rate: item.vat ?? 0,
        }));

        return {
            order_code: generateOrderCode(),
            customer_name: buyerName.trim() || undefined,
            payment_method: paymentMethod === 'CK' ? 'Chuyển khoản' : 'Tiền mặt',
            order_details,
        };
    };

    const handleSaveOnly = () => {
        const orderPayload = validateOrder();
        if (orderPayload) {
            setIsSaving(true);
            saveOrder({ orderPayload }, {
                onSuccess: () => router.push('/history'),
                onSettled: () => setIsSaving(false),
            });
        }
    };

    const handleSaveAndInvoice = () => {
        const orderPayload = validateOrder();
        if (orderPayload && editableOrderItems) {
            setIsInvoicing(true);
            saveAndInvoice({ orderPayload, editableOrderItems }, {
                onSuccess: () => router.push('/history'),
                onSettled: () => setIsInvoicing(false),
            });
        }
    };

    return (
        <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
            {photoState !== 'analyzed' && (
                <Card className="w-full shadow-lg rounded-xl overflow-hidden border">
                    <CardContent className="p-0 sm:p-0 relative bg-slate-900 aspect-[3/4] sm:aspect-video flex items-center justify-center overflow-hidden">
                        {(photoState === 'idle' || photoState === 'permission_pending') && (
                            <div className="flex flex-col items-center gap-4 text-white p-8 text-center">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <p className="text-lg font-medium">Đang khởi động camera...</p>
                                <p className="text-slate-400 text-sm">Vui lòng cho phép truy cập camera nếu được hỏi.</p>
                            </div>
                        )}

                        {(photoState === 'viewing' || photoState === 'permission_pending') && (
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {photoState === 'viewing' && (
                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 px-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => { stopCamera(); setPhotoState('idle'); }}
                                            className="rounded-full bg-white/20 border-white/40 text-white hover:bg-white/40 w-12 h-12"
                                        >
                                            <X className="w-6 h-6" />
                                        </Button>
                                        <Button
                                            onClick={capturePhoto}
                                            className="rounded-full w-16 h-16 bg-white hover:bg-slate-200 p-0 flex items-center justify-center border-4 border-slate-400 shadow-2xl"
                                        >
                                            <div className="w-12 h-12 rounded-full border-2 border-slate-900" />
                                        </Button>
                                        <div className="w-12 h-12" /> {/* Spacer */}
                                    </div>
                                )}
                            </div>
                        )}

                        {photoState === 'captured' && previewUrl && (
                            <div className="relative w-full h-full">
                                <img src={previewUrl} alt="Captured" className="w-full h-full object-contain" />
                            </div>
                        )}

                        {(photoState === 'processing' || isAnalyzing) && (
                            <div className="flex flex-col items-center gap-4 text-white p-8">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <p className="text-lg font-medium">Đang phân tích hình ảnh...</p>
                                <p className="text-slate-400 text-sm text-center">Vui lòng đợi trong giây lát, AI đang trích xuất dữ liệu hóa đơn.</p>
                            </div>
                        )}

                        {photoState === 'error' && (
                            <div className="flex flex-col items-center gap-4 text-white p-8">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                                <p className="text-lg font-medium text-red-400">Gặp lỗi khi xử lý</p>
                                <Button onClick={startCamera} variant="outline" className="text-white border-white/20">Thử lại</Button>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </CardContent>
                </Card>
            )}

            {photoState === 'analyzed' && result && (
                <OrderForm
                    result={result}
                    isTranscribing={isAnalyzing}
                    isSaving={isSaving}
                    isInvoicing={isInvoicing}
                    editableOrderItems={editableOrderItems}
                    buyerName={buyerName}
                    paymentMethod={paymentMethod}
                    orderTotals={{
                        totalBeforeVat: editableOrderItems?.reduce((acc, item) => acc + (item.so_luong || 0) * (item.don_gia || 0), 0) || 0,
                        totalVatAmount: editableOrderItems?.reduce((acc, item) => acc + (item.so_luong || 0) * (item.don_gia || 0) * ((item.vat || 0) / 100), 0) || 0,
                        totalAfterVat: editableOrderItems?.reduce((acc, item) => acc + (item.so_luong || 0) * (item.don_gia || 0) * (1 + (item.vat || 0) / 100), 0) || 0
                    }}
                    imageUrl={previewUrl}
                    audioBlob={null} // Not an audio
                    handleOrderItemChange={handleOrderItemChange}
                    setBuyerName={setBuyerName}
                    setPaymentMethod={setPaymentMethod}
                    handleCancelOrderChanges={() => {
                        resetAll();
                    }}
                    handleSaveOnly={handleSaveOnly}
                    handleSaveAndInvoice={handleSaveAndInvoice}
                />
            )}
        </div>
    );
}
