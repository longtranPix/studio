
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData, UnitConversion } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/use-products';
import { Loader2, Package, Save, X, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlanStatus } from '@/hooks/use-plan-status';

interface ProductFormProps {
    initialData: ProductData | null;
    onCancel: () => void;
    transcription: string;
}

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined' || isNaN(value)) return '0 VND';
    return `${value.toLocaleString('de-DE')} VND`;
};

export function ProductForm({ initialData, onCancel, transcription }: ProductFormProps) {
    const [product, setProduct] = useState<ProductData | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { refetchPlanStatus } = usePlanStatus();

    const { mutate: createProduct, isPending } = useCreateProduct();

    useEffect(() => {
        if (initialData) {
            const sanitizedData = JSON.parse(JSON.stringify(initialData));
            sanitizedData.unit_conversions.forEach((unit: UnitConversion) => {
                if (unit.vat === null || unit.vat === undefined) {
                    unit.vat = 0;
                }
            });
            setProduct(sanitizedData);
        }
    }, [initialData]);

    const handleProductChange = (field: keyof Omit<ProductData, 'unit_conversions'>, value: string) => {
        if (!product) return;
        setProduct({ ...product, [field]: value });
    };

    const handleUnitChange = (index: number, field: keyof UnitConversion, value: string) => {
        if (!product) return;
        const newUnits = [...product.unit_conversions];
        const unitToUpdate = { ...newUnits[index] };
        
        let processedValue: string | number = value;
        if (field === 'conversion_factor' || field === 'price' || field === 'vat') {
            processedValue = value.trim() === '' ? 0 : parseFloat(value) || 0;
        }

        (unitToUpdate as any)[field] = processedValue;
        newUnits[index] = unitToUpdate;
        setProduct({ ...product, unit_conversions: newUnits });
    };

    const addUnit = () => {
        if (!product) return;
        const newUnit: UnitConversion = {
            name_unit: '',
            conversion_factor: 1,
            unit_default: product.unit_conversions[0]?.unit_default || 'Đơn vị',
            price: 0,
            vat: 0
        };
        setProduct({ ...product, unit_conversions: [...product.unit_conversions, newUnit] });
    };

    const removeUnit = (index: number) => {
        if (!product) return;
        const newUnits = product.unit_conversions.filter((_, i) => i !== index);
        setProduct({ ...product, unit_conversions: newUnits });
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (!product || !product.product_name) {
            toast({ title: "Lỗi", description: "Vui lòng nhập tên hàng hóa.", variant: "destructive" });
            return;
        }
        if (product.unit_conversions.length === 0) {
            toast({ title: "Lỗi", description: "Hàng hóa phải có ít nhất một đơn vị tính.", variant: "destructive" });
            return;
        }
        
        for (const unit of product.unit_conversions) {
            if (!unit.name_unit || unit.price == null || unit.conversion_factor == null) {
                toast({ title: "Thiếu thông tin", description: `Vui lòng điền đầy đủ thông tin cho đơn vị "${unit.name_unit || 'mới'}"`, variant: "destructive"});
                return;
            }
        }

        createProduct(product, {
            onSuccess: () => {
                toast({ title: "Thành công", description: `Hàng hóa "${product.product_name}" đã được tạo.`});
                refetchPlanStatus();
                onCancel(); // This resets the audio recorder view
            }
        });
    };

    if (!product) return null;

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package/>Tạo Hàng Hóa Mới</CardTitle>
                <CardDescription>Dữ liệu được trích xuất từ giọng nói của bạn. Vui lòng kiểm tra và chỉnh sửa trước khi lưu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                    <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-inner text-sm">{transcription}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="product_name" className="text-base font-semibold">Tên hàng hóa</Label>
                    <Input id="product_name" value={product.product_name} onChange={e => handleProductChange('product_name', e.target.value)} className={cn(submitted && !product.product_name && "border-destructive")} />
                </div>
                
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Các đơn vị tính</Label>
                    {product.unit_conversions.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                            <p>Không có đơn vị tính nào. Vui lòng thêm một đơn vị.</p>
                        </div>
                    ) : (
                        product.unit_conversions.map((unit, index) => {
                            const isUnitInvalid = submitted && (!unit.name_unit || unit.price == null || unit.conversion_factor == null);
                            return (
                            <div key={index} className="relative pt-4">
                                {product.unit_conversions.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-0 z-10 text-destructive hover:bg-destructive/10"
                                        onClick={() => removeUnit(index)}
                                        aria-label="Xóa đơn vị"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4", isUnitInvalid && "border-destructive bg-destructive/5")}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor={`name_unit_${index}`}>Tên ĐVT</Label>
                                            <Input id={`name_unit_${index}`} value={unit.name_unit} onChange={e => handleUnitChange(index, 'name_unit', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`price_${index}`}>Giá bán (VND)</Label>
                                            <Input type="number" id={`price_${index}`} value={String(unit.price ?? '')} onChange={e => handleUnitChange(index, 'price', e.target.value)} />
                                            {unit.price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(unit.price)}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                         <div>
                                            <Label htmlFor={`conversion_factor_${index}`}>Hệ số quy đổi</Label>
                                            <Input type="number" id={`conversion_factor_${index}`} value={String(unit.conversion_factor ?? '')} onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`unit_default_${index}`}>ĐVT cơ sở</Label>
                                            <Input id={`unit_default_${index}`} value={unit.unit_default} onChange={e => handleUnitChange(index, 'unit_default', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`vat_${index}`}>VAT (%)</Label>
                                            <Input type="number" id={`vat_${index}`} value={String(unit.vat)} onChange={e => handleUnitChange(index, 'vat', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )})
                    )}
                    <Button variant="outline" size="sm" onClick={addUnit}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm đơn vị tính
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                <Button variant="outline" onClick={onCancel} disabled={isPending}>
                    <X className="mr-2 h-4 w-4" /> Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Xác nhận & Lưu
                </Button>
            </CardFooter>
        </Card>
    );
}
