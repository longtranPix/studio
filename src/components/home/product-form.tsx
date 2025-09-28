// src/components/home/product-form.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProductData, UnitConversion, BrandRecord, CatalogRecord, EditableAttributeItem, CreateProductPayload, CreateProductResponse, NewlyCreatedProductData, AttributeTypeRecord, AttributeRecord } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/use-products';
import { useCreateAttribute, useCreateAttributeType, useCreateCatalog, useSearchAttributeTypes, useUpdateAttributeType } from '@/hooks/use-attributes';
import { useCreateBrand } from '@/hooks/use-brands';
import { Loader2, Package, Save, X, Trash2, PlusCircle, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImportSlipForNewProductForm } from '@/components/home/import-slip-for-new-product-form';
import { AttributeCard } from '@/components/home/attribute-card';
import { BrandCard } from '@/components/home/brand-card';
import { CatalogMultiSelect } from '@/components/home/catalog-multi-select';

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
    const [showImportSlipForm, setShowImportSlipForm] = useState(false);
    const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<NewlyCreatedProductData | null>(null);

    // Brand and Catalog state
    const [selectedBrand, setSelectedBrand] = useState<BrandRecord | null>(null);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');
    const [selectedCatalogs, setSelectedCatalogs] = useState<CatalogRecord[]>([]);
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

    // Attributes state
    const [attributes, setAttributes] = useState<EditableAttributeItem[]>([]);
    const attributeKeyCounter = useRef(0);

    const { toast } = useToast();
    const { mutateAsync: createProduct, isPending: isSavingProduct } = useCreateProduct();
    const { mutateAsync: createBrand } = useCreateBrand();
    const { mutateAsync: createCatalog } = useCreateCatalog();
    const { mutateAsync: createAttributeType } = useCreateAttributeType();
    const { mutateAsync: createAttribute } = useCreateAttribute();
    
    const handleSelectBrand = useCallback((brand: BrandRecord) => {
        setSelectedBrand(brand);
    }, []);

    const handleChangeCatalogs = useCallback((catalogs: CatalogRecord[]) => {
        setSelectedCatalogs(catalogs);
    }, []);

    useEffect(() => {
        if (!initialData) return;
        const sanitizedData = JSON.parse(JSON.stringify(initialData)) as ProductData;
        sanitizedData.unit_conversions.forEach((unit: UnitConversion) => {
            unit.vat = unit.vat ?? 0;
            unit.price = unit.price ? Number(unit.price) : null;
            unit.conversion_factor = Number(unit.conversion_factor) || 1;
        });
        setProduct(sanitizedData);

        if (sanitizedData.brand_name) {
             setBrandSearchTerm(sanitizedData.brand_name);
        }
        if (sanitizedData.catalog) {
            setCatalogSearchTerm(sanitizedData.catalog);
        }
        if (sanitizedData.attributes) {
            setAttributes(sanitizedData.attributes.map(attr => ({
                key: `attr-${attributeKeyCounter.current++}`,
                typeSearchTerm: attr.type,
                valueSearchTerm: attr.value,
                typeId: null,
                typeName: attr.type,
                valueId: null,
            })));
        }
    }, [initialData]);


    const handleProductChange = (field: keyof Omit<ProductData, 'unit_conversions'>, value: string) => {
        setProduct(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleUnitChange = (index: number, field: keyof UnitConversion, value: string | number | null) => {
        if (!product) return;
        const newUnits = [...product.unit_conversions];
        (newUnits[index] as any)[field] = value;
        setProduct({ ...product, unit_conversions: newUnits });
    };

    const addUnit = () => {
        if (!product) return;
        const newUnit: UnitConversion = { name_unit: '', conversion_factor: 1, unit_default: product.unit_conversions[0]?.unit_default || 'Đơn vị', price: 0, vat: 0 };
        setProduct({ ...product, unit_conversions: [...product.unit_conversions, newUnit] });
    };

    const removeUnit = (index: number) => {
        if (!product || product.unit_conversions.length <= 1) return;
        setProduct({ ...product, unit_conversions: product.unit_conversions.filter((_, i) => i !== index) });
    };
    
    const handleAttributeChange = (index: number, field: keyof EditableAttributeItem, value: any) => {
        setAttributes(prev => {
            const newAttributes = [...prev];
            if (newAttributes[index]) {
                const updated = { ...newAttributes[index], [field]: value };
                 if (field === 'typeId') {
                    // Reset value when type changes
                    updated.valueId = null;
                }
                newAttributes[index] = updated;
            }
            return newAttributes;
        });
    };
    
    const addAttribute = () => {
        setAttributes(prev => [...prev, { key: `attr-${attributeKeyCounter.current++}`, typeSearchTerm: '', valueSearchTerm: '', typeId: null, typeName: '', valueId: null }]);
    };

    const removeAttribute = (index: number) => {
        setAttributes(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateProductSubmit = async () => {
        setSubmitted(true);
        if (!product || !product.product_name) {
            toast({ title: "Lỗi", description: "Vui lòng điền tên sản phẩm.", variant: "destructive" });
            return;
        }

        const finalUnits = product.unit_conversions.map(unit => ({ ...unit, price: Number(unit.price), conversion_factor: Number(unit.conversion_factor) || 1, vat: Number(unit.vat) || 0 }));
        if (finalUnits.some(unit => unit.price == null || unit.price <= 0)) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng điền giá bán lớn hơn 0 cho tất cả các đơn vị tính.", variant: "destructive" });
            return;
        }

        let brandId = selectedBrand?.id;
        if (!brandId && brandSearchTerm) {
            try {
                const newBrand = await createBrand({ name: brandSearchTerm });
                brandId = newBrand.records[0].id;
                setSelectedBrand(newBrand.records[0]);
            } catch (error) {
                toast({ title: "Lỗi", description: "Không thể tạo thương hiệu mới.", variant: "destructive" });
                return;
            }
        }
        if (!brandId) {
            toast({ title: "Lỗi", description: "Vui lòng chọn hoặc tạo thương hiệu.", variant: "destructive" });
            return;
        }
        
        const catalogIds = selectedCatalogs.map(c => c.id);
        if (catalogSearchTerm) {
             try {
                const newCatalog = await createCatalog({ name: catalogSearchTerm });
                catalogIds.push(newCatalog.records[0].id);
                setSelectedCatalogs([...selectedCatalogs, newCatalog.records[0]]);
                setCatalogSearchTerm('');
            } catch (error) {
                 toast({ title: "Lỗi", description: "Không thể tạo catalog mới.", variant: "destructive" });
                return;
            }
        }
        if (catalogIds.length === 0) {
            toast({ title: "Lỗi", description: "Vui lòng chọn hoặc tạo catalog.", variant: "destructive" });
            return;
        }

        const attributeIds: string[] = [];
        for (const attr of attributes) {
            let typeId = attr.typeId;
            if (!typeId && attr.typeSearchTerm) {
                try {
                    const newType = await createAttributeType({ name: attr.typeSearchTerm, catalogs: catalogIds });
                    typeId = newType.records[0].id;
                } catch (error) {
                    toast({ title: "Lỗi", description: `Không thể tạo loại thuộc tính "${attr.typeSearchTerm}".`, variant: "destructive" });
                    return;
                }
            }

            if (!typeId) continue; // Skip if no type

            let valueId = attr.valueId;
            if (!valueId && attr.valueSearchTerm) {
                try {
                    const newValue = await createAttribute({ value_attribute: attr.valueSearchTerm, attribute_type: { id: typeId } });
                    valueId = newValue.records[0].id;
                } catch (error) {
                    toast({ title: "Lỗi", description: `Không thể tạo giá trị thuộc tính "${attr.valueSearchTerm}".`, variant: "destructive" });
                    return;
                }
            }

            if (valueId) {
                attributeIds.push(valueId);
            }
        }

        const payload: CreateProductPayload = {
            product_name: product.product_name,
            brand_id: brandId,
            attributes_ids: attributeIds,
            catalogs_ids: catalogIds,
            unit_conversions: finalUnits
        };

        createProduct(payload, {
            onSuccess: (data: CreateProductResponse) => {
                if (data.product_data) {
                    setNewlyCreatedProduct(data.product_data);
                    setShowImportSlipForm(true);
                } else {
                    onCancel();
                }
            }
        });
    };

    if (!product) return null;

    if (showImportSlipForm && newlyCreatedProduct) {
        const productForSlip = {
            id: newlyCreatedProduct.product_id,
            fields: { product_name: newlyCreatedProduct.product_name },
            unit_conversions: newlyCreatedProduct.unit_conversions ? newlyCreatedProduct.unit_conversions.map(uc => ({ id: uc.unit_conversion_id, name: uc.name_unit, fields: { ...uc } })) : []
        };
        return (
            <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Truck />Nhập kho cho Sản phẩm mới</CardTitle>
                    <CardDescription>{`Sản phẩm "${newlyCreatedProduct.product_name}" đã được tạo.`}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ImportSlipForNewProductForm product={productForSlip as any} onCancel={onCancel} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Package />Tạo Hàng Hóa Mới</CardTitle>
                <CardDescription>Dữ liệu được trích xuất từ giọng nói. Kiểm tra và chỉnh sửa trước khi lưu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                    <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-100 dark:bg-gray-800 rounded-md shadow-inner text-sm">{transcription}</p>
                </div>
                <div className="space-y-4">
                    <Label className="font-semibold text-base">Thông tin chung</Label>
                     <div className="flex items-center">
                        <Label htmlFor="product_name" className="w-[40%] text-sm font-medium">Tên hàng hóa</Label>
                        <div className="w-[60%]">
                            <Input id="product_name" value={product.product_name} onChange={e => handleProductChange('product_name', e.target.value)} className={cn(submitted && !product.product_name && "border-destructive")} />
                        </div>
                    </div>
                     <div className="flex items-center">
                         <Label className="w-[40%] text-sm font-medium">Thương hiệu</Label>
                         <div className="w-[60%]">
                             <BrandCard
                                selectedBrand={selectedBrand}
                                brandSearchTerm={brandSearchTerm}
                                onSelectBrand={handleSelectBrand}
                                onSearchTermChange={setBrandSearchTerm}
                                submitted={submitted}
                                initialData={initialData ? { brand_name: initialData.brand_name || undefined } : null}
                            />
                        </div>
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label className="font-semibold text-base">Phân loại</Label>
                    <CatalogMultiSelect
                        selectedCatalogs={selectedCatalogs}
                        catalogSearchTerm={catalogSearchTerm}
                        onChangeCatalogs={handleChangeCatalogs}
                        onSearchTermChange={setCatalogSearchTerm}
                        submitted={submitted}
                        initialData={initialData ? { catalog: initialData.catalog || undefined } : null}
                    />
                </div>


                <div className="space-y-4">
                    <Label className="font-semibold text-base">Thuộc tính</Label>
                    {attributes.map((attributeItem, index) => (
                       <AttributeCard
                            key={attributeItem.key}
                            item={attributeItem}
                            onChange={handleAttributeChange}
                            onRemove={() => removeAttribute(index)}
                            selectedCatalogs={selectedCatalogs}
                            submitted={submitted}
                            index={index}
                       />
                    ))}
                    <Button variant="outline" size="sm" onClick={addAttribute} disabled={selectedCatalogs.length === 0}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm thuộc tính
                    </Button>
                </div>

                <div className="space-y-4">
                    <Label className="font-semibold text-base">Các đơn vị tính</Label>
                    {product.unit_conversions.map((unit, index) => (
                        <div key={index} className="relative mt-4">
                            <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4", submitted && (unit.price == null || unit.price <= 0) && "border-destructive bg-destructive/5")}>
                                {product.unit_conversions.length > 1 && (
                                    <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7" onClick={() => removeUnit(index)}>
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
                                        <Input type="number" id={`price_${index}`} value={unit.price === null ? '' : String(unit.price)} placeholder="0" onChange={e => handleUnitChange(index, 'price', e.target.value === '' ? null : Number(e.target.value))} className={cn(submitted && (unit.price == null || unit.price <= 0) && "border-destructive")} />
                                        {unit.price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(Number(unit.price))}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div><Label htmlFor={`conversion_factor_${index}`} className="text-sm">Hệ số quy đổi</Label><Input type="number" id={`conversion_factor_${index}`} value={unit.conversion_factor ? String(unit.conversion_factor) : ''} placeholder="0" onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value === '' ? null : Number(e.target.value))} /></div>
                                    <div><Label htmlFor={`unit_default_${index}`} className="text-sm">ĐVT cơ sở</Label><Input id={`unit_default_${index}`} value={unit.unit_default} onChange={e => handleUnitChange(index, 'unit_default', e.target.value)} /></div>
                                    <div><Label htmlFor={`vat_${index}`} className="text-sm">VAT (%)</Label><Input type="number" id={`vat_${index}`} value={String(unit.vat ?? '')} placeholder="0" onChange={e => handleUnitChange(index, 'vat', e.target.value === '' ? null : Number(e.target.value))} /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addUnit}><PlusCircle className="mr-2 h-4 w-4" /> Thêm đơn vị tính</Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                <Button variant="outline" onClick={onCancel} disabled={isSavingProduct}><X className="mr-2 h-4 w-4" /> Hủy</Button>
                <Button onClick={handleCreateProductSubmit} disabled={isSavingProduct}>
                    {isSavingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu & Tiếp tục
                </Button>
            </CardFooter>
        </Card>
    );
}
