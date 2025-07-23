
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData, UnitConversion, BrandRecord } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/use-products';
import { Loader2, Package, Save, X, Trash2, PlusCircle, AlertCircle, Building, Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlanStatus } from '@/hooks/use-plan-status';
import { useDebouncedCallback } from 'use-debounce';
import { useSearchBrands, useCreateBrand } from '@/hooks/use-brands';

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
    const [selectedBrand, setSelectedBrand] = useState<BrandRecord | null>(null);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');
    const [brandResults, setBrandResults] = useState<BrandRecord[]>([]);
    const [isBrandSearchOpen, setIsBrandSearchOpen] = useState(false);
    const [isSearchingBrands, setIsSearchingBrands] = useState(false);
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');


    const { toast } = useToast();
    const router = useRouter();
    const { refetchPlanStatus } = usePlanStatus();

    const { mutate: createProduct, isPending } = useCreateProduct();
    const { mutateAsync: searchBrands } = useSearchBrands();
    const { mutate: createBrand, isPending: isSavingBrand } = useCreateBrand();

    const debouncedBrandSearch = useDebouncedCallback((query: string) => {
        if (query && query.length >= 1 && !selectedBrand) {
            setIsBrandSearchOpen(true);
            setIsSearchingBrands(true);
            searchBrands(query).then(data => {
                setBrandResults(data);
            }).finally(() => {
                setIsSearchingBrands(false);
            });
        } else {
            setBrandResults([]);
            setIsBrandSearchOpen(false);
        }
    }, 300);

    const handleSelectBrand = (brand: BrandRecord) => {
        setSelectedBrand(brand);
        setBrandSearchTerm(brand.fields.brand_name);
        setIsBrandSearchOpen(false);
        setBrandResults([]);
    };
    
    const handleCreateNewBrand = () => {
        setNewBrandName(brandSearchTerm);
        setIsCreatingBrand(true);
        setIsBrandSearchOpen(false);
    };
    
    const handleSaveNewBrand = () => {
        if (!newBrandName) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên thương hiệu.", variant: "destructive" });
            return;
        }
        createBrand({ brand_name: newBrandName }, {
            onSuccess: (newBrandRecord) => {
                if (newBrandRecord && newBrandRecord.records.length > 0) {
                    handleSelectBrand(newBrandRecord.records[0]);
                    setIsCreatingBrand(false);
                    setNewBrandName('');
                }
            }
        });
    };

    useEffect(() => {
        if (initialData) {
            const sanitizedData = JSON.parse(JSON.stringify(initialData));
            sanitizedData.unit_conversions.forEach((unit: UnitConversion) => {
                if (unit.vat === null || unit.vat === undefined) {
                    unit.vat = 0;
                }
            });
            setProduct(sanitizedData);

            const brandNameToSearch = sanitizedData.brand_name?.trim();
            if (brandNameToSearch) {
                setBrandSearchTerm(brandNameToSearch);
                setIsSearchingBrands(true);
                searchBrands(brandNameToSearch).then(data => {
                    setBrandResults(data);
                    setIsBrandSearchOpen(true);
                    if (data.length === 1) {
                        handleSelectBrand(data[0]);
                    }
                }).finally(() => {
                    setIsSearchingBrands(false);
                });
            }
        }
    }, [initialData, searchBrands]);

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
        if (!product || product.unit_conversions.length <= 1) return;
        const newUnits = product.unit_conversions.filter((_, i) => i !== index);
        setProduct({ ...product, unit_conversions: newUnits });
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (!product || !product.product_name) {
            toast({ title: "Lỗi", description: "Vui lòng nhập tên hàng hóa.", variant: "destructive" });
            return;
        }
        if (!selectedBrand) {
            toast({ title: "Lỗi", description: "Vui lòng chọn thương hiệu.", variant: "destructive" });
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

        const payload = {
            ...product,
            brand_id: selectedBrand.id
        };

        createProduct(payload, {
            onSuccess: () => {
                toast({ title: "Thành công", description: `Hàng hóa "${product.product_name}" đã được tạo.`});
                refetchPlanStatus();
                onCancel(); 
            }
        });
    };

    if (!product) return null;

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl"><Package/>Tạo Hàng Hóa Mới</CardTitle>
                <CardDescription>Dữ liệu được trích xuất từ giọng nói của bạn. Vui lòng kiểm tra và chỉnh sửa trước khi lưu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                    <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-inner text-sm">{transcription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product_name" className="font-semibold text-base">Tên hàng hóa</Label>
                        <Input id="product_name" value={product.product_name} onChange={e => handleProductChange('product_name', e.target.value)} className={cn(submitted && !product.product_name && "border-destructive")} />
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center text-base font-semibold"><Building className="mr-2 h-4 w-4 text-primary" />Thương hiệu</Label>
                        {isCreatingBrand ? (
                             <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                <Input placeholder="Tên thương hiệu mới" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className={cn(submitted && !newBrandName && "border-destructive")} />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingBrand(false)}>Hủy</Button>
                                    <Button size="sm" onClick={handleSaveNewBrand} disabled={isSavingBrand}>
                                        {isSavingBrand && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Lưu
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className="relative w-full">
                                    <div className="relative">
                                        <Input
                                            placeholder="Tìm hoặc tạo thương hiệu..."
                                            value={brandSearchTerm}
                                            onChange={e => {
                                                setBrandSearchTerm(e.target.value);
                                                setSelectedBrand(null);
                                                debouncedBrandSearch(e.target.value);
                                            }}
                                            onFocus={() => { if (brandSearchTerm) setIsBrandSearchOpen(true); }}
                                            onBlur={() => setTimeout(() => setIsBrandSearchOpen(false), 150)}
                                            className={cn("pr-8", submitted && !selectedBrand && "border-destructive")}
                                        />
                                        {isSearchingBrands ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : <Building className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    {isBrandSearchOpen && (
                                        <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {brandResults.length > 0 ? (
                                                brandResults.map(b => (
                                                    <div key={b.id} onMouseDown={() => handleSelectBrand(b)} className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between">
                                                        <p className="font-medium">{b.fields.brand_name}</p>
                                                        {selectedBrand?.id === b.id && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                ))
                                            ) : (
                                                !isSearchingBrands && brandSearchTerm &&
                                                <div onMouseDown={handleCreateNewBrand} className="p-2 text-sm text-center text-muted-foreground hover:bg-accent cursor-pointer">Không có. Nhấn để tạo mới.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleCreateNewBrand}><Plus className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {selectedBrand && !isBrandSearchOpen && (
                            <div className="p-2 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-md text-sm dark:bg-green-900/30 dark:text-green-300">
                                Đã chọn: <span className="font-semibold">{selectedBrand.fields.brand_name}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="space-y-4">
                    <Label className="font-semibold text-base">Các đơn vị tính</Label>
                    {product.unit_conversions.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                            <p>Không có đơn vị tính nào. Vui lòng thêm một đơn vị.</p>
                        </div>
                    ) : (
                        product.unit_conversions.map((unit, index) => {
                            const isUnitInvalid = submitted && (!unit.name_unit || unit.price == null || unit.conversion_factor == null);
                            return (
                            <div key={index} className="relative mt-4">
                                <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4", isUnitInvalid && "border-destructive bg-destructive/5")}>
                                    {product.unit_conversions.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7"
                                            onClick={() => removeUnit(index)}
                                            aria-label="Xóa đơn vị"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor={`name_unit_${index}`} className="text-sm">Tên ĐVT</Label>
                                            <Input id={`name_unit_${index}`} value={unit.name_unit} onChange={e => handleUnitChange(index, 'name_unit', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`price_${index}`} className="text-sm">Giá bán (VND)</Label>
                                            <Input type="number" id={`price_${index}`} value={String(unit.price ?? '')} onChange={e => handleUnitChange(index, 'price', e.target.value)} />
                                            {unit.price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(unit.price)}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                         <div>
                                            <Label htmlFor={`conversion_factor_${index}`} className="text-sm">Hệ số quy đổi</Label>
                                            <Input type="number" id={`conversion_factor_${index}`} value={String(unit.conversion_factor ?? '')} onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`unit_default_${index}`} className="text-sm">ĐVT cơ sở</Label>
                                            <Input id={`unit_default_${index}`} value={unit.unit_default} onChange={e => handleUnitChange(index, 'unit_default', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`vat_${index}`} className="text-sm">VAT (%)</Label>
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

    