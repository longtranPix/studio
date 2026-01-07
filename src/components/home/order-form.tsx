'use client';

import type { ExtractedItem, TranscriptionResponse } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, FileText, RotateCcw, User, Save, Send, Tag, Percent, CircleDollarSign, Package, CreditCard, Hash, QrCode, Plus, Minus, Info, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeDialog } from '@/components/shared/qr-code-dialog';
import { useProfile } from '@/hooks/use-profile';
import { getBankCode, canUseBankTransfer } from '@/lib/bank-utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    imageUrl?: string | null;
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
    handleSaveAndInvoice,
    imageUrl
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
                            <p className="text-base sm:text-lg">Không thể xử lý dữ liệu. Vui lòng thử lại.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {imageUrl && (
                                <div className="space-y-4 mb-6">
                                    <Label className="font-semibold text-base flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-primary" />
                                        Hình ảnh hóa đơn
                                    </Label>
                                    <div className="relative aspect-[3/4] sm:aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                                        <img src={imageUrl} alt="Invoice" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <h3 className="font-bold text-lg border-t pt-6 flex items-center gap-2 text-slate-800">
                                    <Package className="w-5 h-5 text-primary" />
                                    Chi tiết đơn hàng
                                </h3>

                                <div className="space-y-3 px-1">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 ml-0.5">
                                            <User className="h-3.5 w-3.5 text-primary/60" />
                                            Tên người mua
                                        </Label>
                                        <Input
                                            id="buyerName"
                                            value={buyerName}
                                            onChange={(e) => setBuyerName(e.target.value)}
                                            placeholder="Nhập tên người mua (không bắt buộc)"
                                            className="text-lg w-full border-t-0 border-l-0 border-r-0 border-b-2 border-slate-100 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors font-bold p-0 h-10 placeholder:text-slate-300 placeholder:font-medium"
                                        />
                                    </div>
                                </div>

                                {editableOrderItems && editableOrderItems.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            {editableOrderItems.map((item, idx) => (
                                                <div key={idx} className="group relative border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm bg-white hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên sản phẩm</Label>
                                                                </div>
                                                                <Input
                                                                    value={item.ten_hang_hoa}
                                                                    onChange={(e) => handleOrderItemChange(idx, 'ten_hang_hoa', e.target.value)}
                                                                    className="w-full border-none p-0 text-base sm:text-lg font-bold bg-transparent focus-visible:ring-0 placeholder:text-slate-300 h-7"
                                                                    placeholder="Tên sản phẩm..."
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành tiền</Label>
                                                                <span className="text-base font-bold text-primary">
                                                                    {formatCurrency((item.so_luong || 0) * (item.don_gia || 0))}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượng</Label>
                                                                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                                        onClick={() => handleOrderItemChange(idx, 'so_luong', String(Math.max(0, (item.so_luong || 0) - 1)))}
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </Button>
                                                                    <Input
                                                                        type="number"
                                                                        value={String(item.so_luong ?? '')}
                                                                        onChange={(e) => handleOrderItemChange(idx, 'so_luong', e.target.value)}
                                                                        className="flex-1 border-none bg-transparent text-center text-sm font-bold focus-visible:ring-0 h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                                        onClick={() => handleOrderItemChange(idx, 'so_luong', String((item.so_luong || 0) + 1))}
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn vị</Label>
                                                                <Input
                                                                    value={item.don_vi_tinh || ''}
                                                                    onChange={(e) => handleOrderItemChange(idx, 'don_vi_tinh', e.target.value)}
                                                                    className="bg-slate-50 border-slate-200 rounded-xl text-sm h-10 focus-visible:ring-primary/20 font-medium"
                                                                    placeholder="cái, chiếc..."
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn giá</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        value={String(item.don_gia ?? '')}
                                                                        onChange={(e) => handleOrderItemChange(idx, 'don_gia', e.target.value)}
                                                                        className="bg-slate-50 border-slate-200 rounded-xl text-sm h-10 pr-10 focus-visible:ring-primary/20 font-bold"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VAT</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        value={String(item.vat ?? '')}
                                                                        onChange={(e) => handleOrderItemChange(idx, 'vat', e.target.value)}
                                                                        className="bg-slate-50 border-slate-200 rounded-xl text-sm h-10 pr-8 focus-visible:ring-primary/20 font-medium"
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-6 mt-8 border-t-2 border-dashed border-slate-200">
                                            <div className="p-5 bg-slate-50 rounded-2xl space-y-3 mb-6">
                                                <div className="flex justify-between text-sm text-slate-500">
                                                    <span>Tổng tiền hàng (trước thuế):</span>
                                                    <span className="font-semibold text-slate-700">{orderTotals.totalBeforeVat.toLocaleString('vi-VN')} VND</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-500">
                                                    <span>Tổng tiền thuế GTGT:</span>
                                                    <span className="font-semibold text-slate-700">{orderTotals.totalVatAmount.toLocaleString('vi-VN')} VND</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-black text-primary pt-3 border-t border-slate-200">
                                                    <span>TỔNG CỘNG:</span>
                                                    <span>{orderTotals.totalAfterVat.toLocaleString('vi-VN')} VND</span>
                                                </div>
                                            </div>

                                            <div className="mb-8 p-5 bg-white border border-blue-100 rounded-2xl shadow-sm ring-4 ring-blue-50/50">
                                                <div className="space-y-4">
                                                    <Label className="text-base font-bold text-blue-900 flex items-center gap-2">
                                                        <CreditCard className="w-5 h-5" />
                                                        Phương thức thanh toán
                                                    </Label>

                                                    <Select value={paymentMethod} onValueChange={(value: 'CK' | 'TM') => setPaymentMethod(value)}>
                                                        <SelectTrigger id="paymentMethod" className="bg-slate-50 border-slate-200 rounded-xl h-12 focus:ring-blue-500 focus:border-blue-500">
                                                            <SelectValue placeholder="Chọn phương thức..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CK" disabled={!canUseTransfer}>
                                                                Chuyển khoản (CK)
                                                                {!canUseTransfer && <span className="text-xs text-slate-400 ml-2">(Cần cập nhật NH)</span>}
                                                            </SelectItem>
                                                            <SelectItem value="TM">Tiền mặt (TM)</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {paymentMethod === 'CK' && canUseTransfer && profile && (
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
                                                                className="w-full h-12 rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold gap-2"
                                                                disabled={isProcessing}
                                                            >
                                                                <QrCode className="h-5 w-5" />
                                                                Xem mã QR thanh toán
                                                            </Button>
                                                        </QRCodeDialog>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <Button variant="outline" onClick={handleCancelOrderChanges} disabled={isProcessing} className="h-12 rounded-xl border-slate-200 hover:bg-slate-50">
                                                    <RotateCcw className="mr-2 h-4 w-4" /> Quay lại
                                                </Button>
                                                <Button onClick={handleSaveOnly} disabled={isProcessing} className="h-12 rounded-xl bg-slate-800 hover:bg-slate-900">
                                                    <Save className="mr-2 h-4 w-4" /> Lưu đơn
                                                </Button>
                                                <Button onClick={handleSaveAndInvoice} disabled={isProcessing} className="h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                                    <Send className="mr-2 h-4 w-4" /> Xuất hoá đơn
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center text-slate-400 space-y-6 py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-6">
                                        <div className="p-4 bg-white rounded-full shadow-sm">
                                            <FileText className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-base font-medium">Không tìm thấy sản phẩm trong hóa đơn.</p>
                                            <p className="text-sm text-slate-400">Vui lòng quay lại để scan hoặc ghi âm lại.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelOrderChanges}
                                            className="h-12 px-8 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold gap-2 shadow-sm"
                                        >
                                            <RotateCcw className="h-4 w-4" /> Thử lại
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
