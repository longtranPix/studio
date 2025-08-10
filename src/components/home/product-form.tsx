
// src/components/home/product-form.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData, UnitConversion, BrandRecord, CreateImportSlipPayload, ProductRecord, UnitConversionRecord, SupplierRecord, CatalogRecord, AttributeTypeRecord, AttributeRecord, EditableAttributeItem, CreateProductPayload, CreateProductResponse, NewlyCreatedProductData } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/use-products';
import { Loader2, Package, Save, X, Trash2, PlusCircle, AlertCircle, Building, Check, Plus, Truck, Library, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlanStatus } from '@/hooks/use-plan-status';
import { useSearchBrands, useCreateBrand } from '@/hooks/use-brands';
import { useSearchCatalogs, useSearchAttributeTypes, useSearchAttributes, useCreateAttribute, useCreateAttributeType, useCreateCatalog } from '@/hooks/use-attributes';
import { Combobox } from '@/components/shared/combobox';
import { ImportSlipForNewProductForm } from '@/components/home/import-slip-for-new-product-form';

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

    // Brand state
    const [selectedBrand, setSelectedBrand] = useState<BrandRecord | null>(null);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');

    // Catalog state
    const [selectedCatalog, setSelectedCatalog] = useState<CatalogRecord | null>(null);
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

    // Attributes state
    const [attributes, setAttributes] = useState<EditableAttributeItem[]>([]);
    const attributeKeyCounter = useRef(0);

    const { toast } = useToast();
    const { refetchPlanStatus } = usePlanStatus();

    // Hooks
    const { mutate: createProduct, isPending: isSavingProduct } = useCreateProduct();
    const { mutateAsync: searchBrands } = useSearchBrands();
    const { mutateAsync: createBrand } = useCreateBrand();
    const { mutateAsync: searchCatalogs } = useSearchCatalogs();
    const { mutateAsync: createCatalog } = useCreateCatalog();
    const { mutateAsync: searchAttributeTypes } = useSearchAttributeTypes();
    const { mutateAsync: searchAttributes } = useSearchAttributes();
    const { mutateAsync: createAttributeType } = useCreateAttributeType();
    const { mutateAsync: createAttribute } = useCreateAttribute();

    useEffect(() => {
        if (!initialData) return;
    
        const sanitizedData = JSON.parse(JSON.stringify(initialData)) as ProductData;
    
        if (sanitizedData.unit_conversions.length === 1 && initialData.unit_conversions.some(u => u.price > 0)) {
            const originalUnitWithPrice = initialData.unit_conversions.find(u => u.price > 0);
             if (originalUnitWithPrice) {
                sanitizedData.unit_conversions[0].price = originalUnitWithPrice.price;
            }
        }
    
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
            const newAttributes: EditableAttributeItem[] = sanitizedData.attributes.map(c => ({
                key: `attr-${attributeKeyCounter.current++}`,
                typeSearchTerm: c.type,
                valueSearchTerm: c.value,
                typeId: null,
                typeName: c.type,
                valueId: null,
                isCreatingType: false,
                isCreatingValue: false
            }));
            setAttributes(newAttributes);
        }
    }, [initialData]);

    const handleProductChange = (field: keyof Omit<ProductData, 'unit_conversions'>, value: string) => {
        setProduct(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleUnitChange = (index: number, field: keyof UnitConversion, value: string | number | null) => {
        if (!product) return;
        const newUnits = [...product.unit_conversions];
        const unitToUpdate = { ...newUnits[index] };

        (unitToUpdate as any)[field] = value;
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

    const handleCreateProductSubmit = () => {
        setSubmitted(true);
        if (!product || !product.product_name || !selectedBrand?.id || !selectedCatalog?.id || product.unit_conversions.length === 0) {
            toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin sản phẩm, thương hiệu và catalog.", variant: "destructive" });
            return;
        }

        const finalUnits = product.unit_conversions.map(unit => ({
            ...unit,
            price: Number(unit.price) || 0,
            conversion_factor: Number(unit.conversion_factor) || 0,
            vat: Number(unit.vat) || 0,
        }));

        for (const unit of finalUnits) {
            if (!unit.name_unit || unit.price == null || unit.conversion_factor == null) {
                toast({ title: "Thiếu thông tin", description: `Vui lòng điền đầy đủ thông tin cho đơn vị "${unit.name_unit || 'mới'}"`, variant: "destructive" });
                return;
            }
        }

        const attributeIds = attributes.map(c => c.valueId).filter((id): id is string => !!id);
        if (attributes.some(c => !c.valueId && c.valueSearchTerm)) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng chọn hoặc tạo giá trị cho các thuộc tính.", variant: "destructive" });
            return;
        }

        const payload: CreateProductPayload = {
            product_name: product.product_name,
            brand_id: selectedBrand.id,
            attributes_ids: attributeIds,
            unit_conversions: finalUnits
        };

        createProduct(payload, {
            onSuccess: (data: CreateProductResponse) => {
                if (data.product_data) {
                    setNewlyCreatedProduct(data.product_data);
                    setShowImportSlipForm(true);
                } else {
                     onCancel(); // fallback if product_data is missing
                }
            }
        });
    };

    const addAttribute = () => {
        setAttributes(prev => [...prev, { key: `attr-${attributeKeyCounter.current++}`, typeSearchTerm: '', valueSearchTerm: '', typeId: null, typeName: '', valueId: null, isCreatingType: false, isCreatingValue: false }]);
    }
    const removeAttribute = (key: string) => {
        setAttributes(prev => prev.filter(c => c.key !== key));
    }
    const handleAttributeChange = <K extends keyof EditableAttributeItem>(key: string, field: K, value: EditableAttributeItem[K]) => {
        setAttributes(prev => prev.map(c => {
            if (c.key === key) {
                const updated = { ...c, [field]: value };
                if (field === 'typeId') {
                    // Reset value when type changes
                    updated.valueId = null;
                    updated.valueSearchTerm = '';
                }
                return updated;
            }
            return c;
        }));
    }


    if (!product) return null;

    if (showImportSlipForm && newlyCreatedProduct) {
      const productForSlip = {
        id: newlyCreatedProduct.id,
        fields: {
          product_name: newlyCreatedProduct.product_name,
        },
        unit_conversions: newlyCreatedProduct.unit_conversions ? newlyCreatedProduct.unit_conversions.map(uc => ({
          id: uc.unit_conversion_id,
          name: uc.name_unit,
          fields: {
            name_unit: uc.name_unit,
            price: uc.price,
            vat_rate: uc.vat,
            conversion_factor: uc.conversion_factor,
            unit_default: uc.unit_default,
          }
        })) : []
      }
      return (
          <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Truck />Nhập kho cho Sản phẩm mới</CardTitle>
                  <CardDescription>{`Sản phẩm "${newlyCreatedProduct.product_name}" đã được tạo.`}</CardDescription>
              </CardHeader>
              <CardContent>
                  <ImportSlipForNewProductForm 
                      product={productForSlip as any} // Cast because the structure is slightly different
                      onCancel={onCancel}
                  />
              </CardContent>
          </Card>
      )
    }

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Package />Tạo Hàng Hóa Mới</CardTitle>
                <CardDescription>Dữ liệu được trích xuất từ giọng nói. Kiểm tra và chỉnh sửa trước khi lưu.</CardDescription>
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
                        <Label className="font-semibold text-base">Thương hiệu</Label>
                        <Combobox
                            value={selectedBrand?.id || ''}
                            onValueChange={(id, label, record) => {
                                setSelectedBrand(id ? record : null)
                            }}
                            onSearchChange={setBrandSearchTerm}
                            initialSearchTerm={brandSearchTerm}
                            placeholder="Tìm hoặc tạo thương hiệu..."
                            searchFn={searchBrands}
                            createFn={async (name) => createBrand({ name })}
                            isInvalid={submitted && !selectedBrand}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="font-semibold text-base">Catalog</Label>
                    <Combobox
                        value={selectedCatalog?.id || ''}
                        onValueChange={(id, label, record) => {
                            setSelectedCatalog(id ? record : null)
                             // Reset attributes when catalog changes
                            setAttributes([]);
                        }}
                        onSearchChange={setCatalogSearchTerm}
                        initialSearchTerm={catalogSearchTerm}
                        placeholder="Tìm hoặc tạo catalog..."
                        searchFn={searchCatalogs}
                        createFn={async (name) => createCatalog({ name })}
                        isInvalid={submitted && !selectedCatalog}
                    />
                </div>

                <div className="space-y-4">
                    <Label className="font-semibold text-base">Thuộc tính</Label>
                    {attributes.map((attributeItem) => (
                        <div key={attributeItem.key} className="relative mt-4">
                            <div className="border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7" onClick={() => removeAttribute(attributeItem.key)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Loại thuộc tính</Label>
                                         <Combobox
                                            value={attributeItem.typeId || ''}
                                            onValueChange={(id, label, record) => {
                                                handleAttributeChange(attributeItem.key, 'typeId', id);
                                                handleAttributeChange(attributeItem.key, 'typeName', label || '');
                                            }}
                                            onSearchChange={(term) => handleAttributeChange(attributeItem.key, 'typeSearchTerm', term)}
                                            initialSearchTerm={attributeItem.typeSearchTerm}
                                            placeholder="Tìm hoặc tạo loại..."
                                            searchFn={(term) => searchAttributeTypes({ query: term, catalogId: selectedCatalog?.id || null })}
                                            createFn={async (name) => {
                                                if (!selectedCatalog) return null;
                                                return createAttributeType({ name, catalog: { id: selectedCatalog.id } });
                                            }}
                                            isInvalid={submitted && !attributeItem.typeId}
                                            disabled={!selectedCatalog}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Giá trị thuộc tính</Label>
                                        <Combobox
                                            value={attributeItem.valueId || ''}
                                            onValueChange={(id, label, record) => {
                                                handleAttributeChange(attributeItem.key, 'valueId', id);
                                            }}
                                            onSearchChange={(term) => handleAttributeChange(attributeItem.key, 'valueSearchTerm', term)}
                                            initialSearchTerm={attributeItem.valueSearchTerm}
                                            placeholder="Chọn giá trị..."
                                            searchFn={(term) => searchAttributes({ query: term, typeId: attributeItem.typeId })}
                                            createFn={async (name) => {
                                                if (!attributeItem.typeId) {
                                                    toast({ title: 'Lỗi', description: 'Vui lòng chọn loại thuộc tính trước.', variant: 'destructive'})
                                                    return null;
                                                };
                                                return createAttribute({ value: name, attribute_type: { id: attributeItem.typeId } });
                                            }}
                                            disabled={!attributeItem.typeId}
                                            isInvalid={submitted && !!attributeItem.valueSearchTerm && !attributeItem.valueId}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addAttribute} disabled={!selectedCatalog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm thuộc tính
                    </Button>
                </div>

                <div className="space-y-4">
                    <Label className="font-semibold text-base">Các đơn vị tính</Label>
                    {product.unit_conversions.map((unit, index) => {
                        const isUnitInvalid = submitted && (!unit.name_unit || unit.price == null || unit.conversion_factor == null);
                        return (
                            <div key={index} className="relative mt-4">
                                <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4", isUnitInvalid && "border-destructive bg-destructive/5")}>
                                    {product.unit_conversions.length > 1 && (
                                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7" onClick={() => removeUnit(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label htmlFor={`name_unit_${index}`} className="text-sm">Tên ĐVT</Label><Input id={`name_unit_${index}`} value={unit.name_unit} onChange={e => handleUnitChange(index, 'name_unit', e.target.value)} /></div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`price_${index}`} className="text-sm">Giá bán (VND)</Label>
                                            <Input type="number" id={`price_${index}`} value={unit.price === null ? '' : String(unit.price)} placeholder="0" onChange={e => handleUnitChange(index, 'price', e.target.value === '' ? null : Number(e.target.value))} />
                                            {unit.price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(Number(unit.price))}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor={`conversion_factor_${index}`} className="text-sm">Hệ số quy đổi</Label>
                                            <Input type="number" id={`conversion_factor_${index}`} value={unit.conversion_factor ? String(unit.conversion_factor) : ''} placeholder="0" onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value === '' ? null : Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`unit_default_${index}`} className="text-sm">ĐVT cơ sở</Label>
                                            <Input id={`unit_default_${index}`} value={unit.unit_default} onChange={e => handleUnitChange(index, 'unit_default', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`vat_${index}`} className="text-sm">VAT (%)</Label>
                                            <Input type="number" id={`vat_${index}`} value={String(unit.vat ?? '')} placeholder="0" onChange={e => handleUnitChange(index, 'vat', e.target.value === '' ? null : Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <Button variant="outline" size="sm" onClick={addUnit}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm đơn vị tính
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                <Button variant="outline" onClick={onCancel} disabled={isSavingProduct}>
                    <X className="mr-2 h-4 w-4" /> Hủy
                </Button>
                <Button onClick={handleCreateProductSubmit} disabled={isSavingProduct}>
                    {isSavingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu & Tiếp tục
                </Button>
            </CardFooter>
        </Card>
    );
}

    

    