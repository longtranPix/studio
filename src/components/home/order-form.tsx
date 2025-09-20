
'use client';

import type { ExtractedItem, TranscriptionResponse } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, FileText, RotateCcw, User, Save, Send, Tag, Percent, CircleDollarSign, Package, CreditCard, Hash, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeDialog } from '@/components/shared/qr-code-dialog';
import { useProfile } from '@/hooks/use-profile';
import { getBankCode, canUseBankTransfer } from '@/lib/bank-utils';

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined') return '';
  return `${value.toLocaleString('vi-VN')} VND`;
};

const WaveformLoader = () => (
  <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 sm:py-12">
    <div className="flex justify-center items-end gap-2 h-16">
      <span className="w-2 h-4 bg-primary/30 rounded-full animate-sound-wave-color" style={{ animationDelay: '0.1s' }}></span>
      <span className="w-2 h-8 bg-primary/30 rounded-full animate-sound-wave-color" style={{ animationDelay: '0.2s' }}></span>
      <span className="w-2 h-12 bg-primary/30 rounded-full animate-sound-wave-color" style={{ animationDelay: '0.3s' }}></span>
      <span className="w-2 h-8 bg-primary/30 rounded-full animate-sound-wave-color" style={{ animationDelay: '0.4s' }}></span>
      <span className="w-2 h-4 bg-primary/30 rounded-full animate-sound-wave-color" style={{ animationDelay: '0.5s' }}></span>
    </div>
    <p className="font-semibold text-base text-muted-foreground">Đang xử lý thông tin đơn hàng...</p>
  </div>
);

interface OrderFormProps {
    result: TranscriptionResponse | null;
    isTranscribing: boolean;
    isSaving: boolean;
    isInvoicing: boolean;
    editableOrderItems: ExtractedItem[] | null;
    buyerName: string;
    paymentMethod: 'CK' | 'TM';
    orderTotals: { totalBeforeVat: number; totalVatAmount: number; totalAfterVat: number; };
    audioBlob: Blob | null;
    handleOrderItemChange: (itemIndex: number, field: keyof ExtractedItem, value: string) => void;
    setBuyerName: (name: string) => void;
    setPaymentMethod: (method: 'CK' | 'TM') => void;
    handleCancelOrderChanges: () => void;
    handleSaveOnly: () => void;
    handleSaveAndInvoice: () => void;
}

export function OrderForm({
    result,
    isTranscribing,
    isSaving,
    isInvoicing,
    editableOrderItems,
    buyerName,
    paymentMethod,
    orderTotals,
    audioBlob,
    handleOrderItemChange,
    setBuyerName,
    setPaymentMethod,
    handleCancelOrderChanges,
    handleSaveOnly,
    handleSaveAndInvoice
}: OrderFormProps) {
    const { data: profile } = useProfile();
    const canUseTransfer = canUseBankTransfer(profile);
    const isProcessing = isTranscribing || isSaving || isInvoicing;

    // Generate order code for QR code
    const generateOrderCode = (): string => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `DH${day}${month}${year}-${random}`;
    };

    return (
        <div className="relative">
            {(isSaving || isInvoicing) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm animate-fade-in-up">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold">
                        {isSaving ? 'Đang lưu đơn hàng...' : 'Đang xử lý hoá đơn...'}
                    </p>
                </div>
            )}
            <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                <CardContent className="p-4 sm:p-6">
                    {isTranscribing ? (
                        <WaveformLoader />
                    ) : !result ? (
                        <div className="flex flex-col items-center justify-center text-center text-red-500 space-y-4 py-8 sm:py-12">
                            <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-red-500/50">
                                <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />
                            </div>
                            <p className="text-base sm:text-lg">Không thể xử lý âm thanh. Vui lòng thử lại.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                                <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{result.transcription}</p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-semibold text-base border-t pt-6">Chỉnh Sửa Đơn Hàng</h3>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Tên người mua:</span>
                                    </div>
                                    <div className="w-[65%] flex items-center justify-start ml-2">
                                        <Input 
                                            id="buyerName" 
                                            value={buyerName} 
                                            onChange={(e) => setBuyerName(e.target.value)} 
                                            placeholder="Nhập tên người mua hàng (không bắt buộc)" 
                                            className="text-sm w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                        />
                                    </div>
                                </div>

                                {editableOrderItems && editableOrderItems.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {editableOrderItems.map((item, idx) => (
                                                <div key={idx} className="border p-4 rounded-lg shadow-sm bg-gray-50 space-y-3">
                                                    {/* Product Name */}
                                                    <div className="flex items-center">
                                                        <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                                            <Package className="mr-2 h-4 w-4" />
                                                            <span>Tên hàng hóa:</span>
                                                        </div>
                                                        <div className="w-[65%] flex items-center justify-start ml-2">
                                                            <Input 
                                                                id={`ten_${idx}`} 
                                                                value={item.ten_hang_hoa} 
                                                                onChange={(e) => handleOrderItemChange(idx, 'ten_hang_hoa', e.target.value)} 
                                                                className="w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Unit and Quantity */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="flex items-center">
                                                            <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                                                <Tag className="mr-2 h-4 w-4" />
                                                                <span>Đơn vị:</span>
                                                            </div>
                                                            <div className="w-[65%] flex items-center justify-start ml-2">
                                                                <Input 
                                                                    id={`dvt_${idx}`} 
                                                                    value={item.don_vi_tinh || ''} 
                                                                    onChange={(e) => handleOrderItemChange(idx, 'don_vi_tinh', e.target.value)} 
                                                                    placeholder="cái, chiếc..." 
                                                                    className="w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                                                <Hash className="mr-2 h-4 w-4" />
                                                                <span>Số lượng:</span>
                                                            </div>
                                                            <div className="w-[65%] flex items-center justify-start ml-2">
                                                                <Input 
                                                                    id={`sl_${idx}`} 
                                                                    type="number" 
                                                                    value={String(item.so_luong ?? '')} 
                                                                    onChange={(e) => handleOrderItemChange(idx, 'so_luong', e.target.value)} 
                                                                    className="w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Price and Tax */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center">
                                                                <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                                                    <CircleDollarSign className="mr-2 h-4 w-4" />
                                                                    <span>Đơn giá:</span>
                                                                </div>
                                                                <div className="w-[65%] flex items-center justify-start ml-2">
                                                                    <Input 
                                                                        id={`dg_${idx}`} 
                                                                        type="number" 
                                                                        value={String(item.don_gia ?? '')} 
                                                                        onChange={(e) => handleOrderItemChange(idx, 'don_gia', e.target.value)} 
                                                                        className="w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                                                    />
                                                                </div>
                                                            </div>
                                                            {item.don_gia != null && (
                                                                <div className="flex justify-end mt-1">
                                                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.don_gia)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div className="w-[35%] flex items-center justify-start text-sm font-medium text-gray-700">
                                                                <Percent className="mr-2 h-4 w-4" />
                                                                <span>Thuế GTGT:</span>
                                                            </div>
                                                            <div className="w-[65%] flex items-center justify-start ml-2">
                                                                <Input 
                                                                    id={`vat_${idx}`} 
                                                                    type="number" 
                                                                    value={String(item.vat ?? '')} 
                                                                    onChange={(e) => handleOrderItemChange(idx, 'vat', e.target.value)} 
                                                                    placeholder="Ví dụ: 10" 
                                                                    className="w-full border border-gray-300 bg-white focus:ring-0 focus:border-blue-500" 
                                                                />
                                                            </div>
                                                        </div>
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
                                            
                                            {/* Payment Method Section - Highlighted */}
                                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                                <div className="space-y-3">
                                                    <div className="mb-3">
                                                        <Label className="text-base font-semibold text-blue-800 flex items-center">
                                                            <CreditCard className="mr-2 h-5 w-5" />
                                                            Phương thức thanh toán
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-full">
                                        <Select value={paymentMethod} onValueChange={(value: 'CK' | 'TM') => setPaymentMethod(value)}>
                                                                <SelectTrigger id="paymentMethod" className="bg-white border border-blue-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                                                <SelectValue placeholder="Chọn phương thức..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CK" disabled={!canUseTransfer}>
                                                    Chuyển khoản (CK)
                                                    {!canUseTransfer && (
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            (Cần cập nhật thông tin ngân hàng)
                                                        </span>
                                                    )}
                                                </SelectItem>
                                                <SelectItem value="TM">Tiền mặt (TM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                                        </div>
                                                    </div>
                                        
                                        {/* QR Code Button for Bank Transfer */}
                                        {paymentMethod === 'CK' && canUseTransfer && profile && (
                                                        <div className="mt-3">
                                                <QRCodeDialog
                                                    bankId={getBankCode(profile.bank_name || '') || ''}
                                                    accountNo={profile.bank_number || ''}
                                                    accountName={profile.account_name || ''}
                                                    amount={orderTotals.totalAfterVat}
                                                    orderCode={generateOrderCode()}
                                                    bankName={profile.bank_name || ''}
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-violet-400 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:border-violet-500"
                                                        disabled={isProcessing}
                                                    >
                                                        <QrCode className="h-4 w-4 mr-2" />
                                                        Xem QR Code Chuyển Khoản
                                                    </Button>
                                                </QRCodeDialog>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                                <Button variant="outline" onClick={handleCancelOrderChanges} disabled={isProcessing} className="w-full sm:w-auto"><RotateCcw className="mr-2 h-4 w-4" />Hoàn tác</Button>
                                                <Button onClick={handleSaveOnly} disabled={isProcessing} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" />Lưu đơn hàng</Button>
                                                <Button onClick={handleSaveAndInvoice} disabled={isProcessing} className="font-semibold w-full sm:w-auto"><Send className="mr-2 h-4 w-4" />Lưu & Xuất hoá đơn</Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 py-8 sm:py-12">
                                        <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-gray-300">
                                            <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                                        </div>
                                        <p className="text-base sm:text-lg">Không có thông tin đơn hàng trong bản ghi.</p>
                                    </div>
                                )}
                            </div>
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
