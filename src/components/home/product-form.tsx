
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData, UnitConversion, BrandRecord, CreateImportSlipPayload, ProductRecord, UnitConversionRecord, SupplierRecord, ProductLineRecord, CatalogTypeRecord, CatalogRecord, EditableCatalogItem, CreateProductPayload } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/use-products';
import { Loader2, Package, Save, X, Trash2, PlusCircle, AlertCircle, Building, Check, Plus, Truck, Library, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlanStatus } from '@/hooks/use-plan-status';
import { useDebouncedCallback } from 'use-debounce';
import { useSearchBrands, useCreateBrand } from '@/hooks/use-brands';
import { useSearchProductLines, useSearchCatalogTypes, useSearchCatalogs, useCreateCatalog, useCreateCatalogType, useCreateProductLine } from '@/hooks/use-attributes';
import { useCreateImportSlip } from '@/hooks/use-orders';
import { useSearchSuppliers, useCreateSupplier } from '@/hooks/use-suppliers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/shared/combobox';

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

    // Brand state
    const [selectedBrand, setSelectedBrand] = useState<BrandRecord | null>(null);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');

    // Product line state
    const [selectedProductLine, setSelectedProductLine] = useState<ProductLineRecord | null>(null);
    const [productLineSearchTerm, setProductLineSearchTerm] = useState('');

    // Catalogs state
    const [catalogs, setCatalogs] = useState<EditableCatalogItem[]>([]);
    const catalogKeyCounter = useRef(0);

    const { toast } = useToast();
    const { refetchPlanStatus } = usePlanStatus();

    // Hooks
    const { mutate: createProduct, isPending: isSavingProduct } = useCreateProduct();
    const { mutateAsync: searchBrands } = useSearchBrands();
    const { mutateAsync: createBrand } = useCreateBrand();
    const { mutateAsync: searchProductLines } = useSearchProductLines();
    const { mutateAsync: createProductLine } = useCreateProductLine();
    const { mutateAsync: searchCatalogTypes } = useSearchCatalogTypes();
    const { mutateAsync: searchCatalogs } = useSearchCatalogs();
    const { mutateAsync: createCatalogType } = useCreateCatalogType();
    const { mutateAsync: createCatalog } = useCreateCatalog();

    // Import slip state
    const [showImportSlipForm, setShowImportSlipForm] = useState(false);
    const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<(ProductRecord & { unit_conversions: UnitConversionRecord[] }) | null>(null);
    const [importQuantity, setImportQuantity] = useState<number | string>(1);
    const [importPrice, setImportPrice] = useState<number | string>('');
    const [importUnitId, setImportUnitId] = useState<string>('');
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

    const { mutate: createImportSlip, isPending: isSavingImportSlip } = useCreateImportSlip({
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã tạo phiếu nhập kho cho sản phẩm mới.' });
            refetchPlanStatus();
            onCancel();
        }
    });
    const { mutateAsync: searchSuppliers } = useSearchSuppliers();
    const { mutateAsync: createSupplier } = useCreateSupplier();

    const isPending = isSavingProduct || isSavingImportSlip;

    useEffect(() => {
        if (!initialData) return;

        const sanitizedData = JSON.parse(JSON.stringify(initialData)) as ProductData;
        sanitizedData.unit_conversions.forEach((unit: UnitConversion) => {
            unit.vat = unit.vat ?? 0;
            unit.price = Number(unit.price) || 0;
            unit.conversion_factor = Number(unit.conversion_factor) || 0;
        });
        setProduct(sanitizedData);

        if (sanitizedData.brand_name) {
            setBrandSearchTerm(sanitizedData.brand_name);
        }
        if (sanitizedData.product_line) {
            setProductLineSearchTerm(sanitizedData.product_line);
        }
        if (sanitizedData.catalogs) {
            const newCatalogs: EditableCatalogItem[] = sanitizedData.catalogs.map(c => ({
                key: `cat-${catalogKeyCounter.current++}`,
                typeSearchTerm: c.type,
                valueSearchTerm: c.value,
                typeId: null,
                typeName: '',
                valueId: null,
                isCreatingType: false,
                isCreatingValue: false
            }));
            setCatalogs(newCatalogs);
        }
    }, [initialData]);


    useEffect(() => {
        if (newlyCreatedProduct?.unit_conversions?.length === 1) {
            setImportUnitId(newlyCreatedProduct.unit_conversions[0].id);
        }
    }, [newlyCreatedProduct]);


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
        if (!product || !product.product_name || !selectedBrand?.id || !selectedProductLine?.id || product.unit_conversions.length === 0) {
            toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin sản phẩm, thương hiệu và ngành hàng.", variant: "destructive" });
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

        const catalogIds = catalogs.map(c => c.valueId).filter((id): id is string => !!id);
        if (catalogs.some(c => c.typeId && !c.valueId)) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng chọn đầy đủ giá trị cho các thuộc tính đã chọn.", variant: "destructive" });
            return;
        }

        const payload: CreateProductPayload = {
            product_name: product.product_name,
            brand_id: selectedBrand.id,
            product_line_id: selectedProductLine.id,
            catalogs_id: catalogIds,
            unit_conversions: finalUnits,
        };

        createProduct(payload, {
            onSuccess: (data) => {
                toast({ title: "Thành công", description: `Hàng hóa "${product.product_name}" đã được tạo. Giờ bạn có thể nhập kho.` });
                setNewlyCreatedProduct(data);
                setShowImportSlipForm(true);
            }
        });
    };

    const handleImportSlipSubmit = () => {
        if (!newlyCreatedProduct || !selectedSupplier || !importUnitId || !importQuantity || !importPrice) {
            toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn nhà cung cấp, nhập số lượng và giá nhập.', variant: 'destructive' });
            return;
        }

        const payload: CreateImportSlipPayload = {
            supplier_id: selectedSupplier.id,
            import_type: 'Nhập mua',
            import_slip_details: [
                {
                    product_id: newlyCreatedProduct.id,
                    unit_conversions_id: importUnitId,
                    quantity: Number(importQuantity),
                    unit_price: Number(importPrice),
                    vat: 0, // Default VAT to 0 for initial import
                }
            ],
        };
        createImportSlip(payload);
    }

    // Catalog handlers
    const addCatalog = () => {
        setCatalogs(prev => [...prev, { key: `cat-${catalogKeyCounter.current++}`, typeSearchTerm: '', valueSearchTerm: '', typeId: null, typeName: '', valueId: null, isCreatingType: false, isCreatingValue: false }]);
    }
    const removeCatalog = (key: string) => {
        setCatalogs(prev => prev.filter(c => c.key !== key));
    }
    const handleCatalogChange = <K extends keyof EditableCatalogItem>(key: string, field: K, value: EditableCatalogItem[K]) => {
        setCatalogs(prev => prev.map(c => {
            if (c.key === key) {
                const updated = { ...c, [field]: value };
                // If type is changed/cleared, reset value
                if (field === 'typeId') {
                    updated.valueId = null;
                    updated.valueSearchTerm = '';
                }
                // If value is cleared, reset valueId
                if ((field === 'valueSearchTerm' && value === '') || (field === 'valueId' && value === null)) {
                     updated.valueId = null;
                }
                return updated;
            }
            return c;
        }));
    }

    const handleCatalogValueSelect = (key: string, record: CatalogRecord) => {
        const catalogType = record.fields.catalog_type?.[0];
        setCatalogs(prev => prev.map(c => {
            if (c.key === key) {
                return {
                    ...c,
                    valueId: record.id,
                    valueSearchTerm: record.fields.name,
                    // Auto-fill type information
                    typeId: catalogType?.id || c.typeId,
                    typeName: catalogType?.title || c.typeName,
                    typeSearchTerm: catalogType?.title || c.typeSearchTerm,
                };
            }
            return c;
        }));
    }


    if (!product) return null;

    return (
        <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Package />Tạo Hàng Hóa Mới</CardTitle>
                <CardDescription>Dữ liệu được trích xuất từ giọng nói. Kiểm tra và chỉnh sửa trước khi lưu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!showImportSlipForm && (
                    <>
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
                                    onValueChange={(id, label) => {
                                        setSelectedBrand(id ? { id, fields: { name: label || '' } } : null)
                                    }}
                                    onSearchChange={setBrandSearchTerm}
                                    initialSearchTerm={brandSearchTerm}
                                    placeholder="Tìm hoặc tạo thương hiệu..."
                                    searchFn={searchBrands}
                                    createFn={async (name) => createBrand({ name })}
                                    isInvalid={submitted && !selectedBrand}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-base">Ngành hàng</Label>
                                <Combobox
                                    value={selectedProductLine?.id || ''}
                                    onValueChange={(id, label) => setSelectedProductLine(id ? { id, fields: { name: label || '' } } : null)}
                                    onSearchChange={setProductLineSearchTerm}
                                    initialSearchTerm={productLineSearchTerm}
                                    placeholder="Tìm hoặc tạo ngành hàng..."
                                    searchFn={searchProductLines}
                                    createFn={async (name) => createProductLine({ name })}
                                    isInvalid={submitted && !selectedProductLine}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="font-semibold text-base">Thuộc tính</Label>
                            {catalogs.map((catalogItem) => (
                                <div key={catalogItem.key} className="relative mt-4">
                                    <div className="border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7" onClick={() => removeCatalog(catalogItem.key)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-sm">Loại thuộc tính</Label>
                                                <Combobox
                                                    value={catalogItem.typeId || ''}
                                                    onValueChange={(id, label) => {
                                                        handleCatalogChange(catalogItem.key, 'typeId', id);
                                                        handleCatalogChange(catalogItem.key, 'typeName', label || '');
                                                    }}
                                                    onSearchChange={(term) => handleCatalogChange(catalogItem.key, 'typeSearchTerm', term)}
                                                    initialSearchTerm={catalogItem.typeSearchTerm}
                                                    placeholder="Tìm hoặc tạo loại..."
                                                    searchFn={searchCatalogTypes}
                                                    createFn={async (name) => createCatalogType({ name })}
                                                    isInvalid={submitted && !catalogItem.typeId}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-sm">Giá trị thuộc tính</Label>
                                                <Combobox
                                                    value={catalogItem.valueId || ''}
                                                    onValueChange={(_, __, record) => handleCatalogValueSelect(catalogItem.key, record as CatalogRecord)}
                                                    onSearchChange={(term) => handleCatalogChange(catalogItem.key, 'valueSearchTerm', term)}
                                                    initialSearchTerm={catalogItem.valueSearchTerm}
                                                    placeholder="Tìm hoặc tạo giá trị..."
                                                    searchFn={(term) => searchCatalogs({ query: term, typeId: catalogItem.typeId })}
                                                    createFn={async (name) => {
                                                        if (!catalogItem.typeId) throw new Error("A type must be selected before creating a value.");
                                                        return createCatalog({ value: name, catalog_type: { id: catalogItem.typeId } });
                                                    }}
                                                    isInvalid={submitted && catalogItem.typeId != null && !catalogItem.valueId}
                                                    disabled={!catalogItem.typeId && !catalogItem.valueSearchTerm}
                                                    displayFormatter={(item: CatalogRecord) => {
                                                        const typeName = catalogItem.typeName || item.fields.catalog_type?.[0]?.title;
                                                        return typeName ? `${typeName} - ${item.fields.name}` : item.fields.name;
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addCatalog}>
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
                                                    <Input type="number" id={`price_${index}`} value={unit.price ? String(unit.price) : ''} placeholder="0" onChange={e => handleUnitChange(index, 'price', e.target.value === '' ? null : Number(e.target.value))} />
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
                    </>
                )}

                {showImportSlipForm && newlyCreatedProduct?.id && (
                    <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 space-y-4 animate-fade-in-up">
                        <h3 className="font-bold text-lg text-primary flex items-center"><Truck className="mr-2" />Nhập kho cho sản phẩm mới</h3>
                        <p>Sản phẩm: <strong className="font-semibold">{newlyCreatedProduct.fields.product_name}</strong></p>

                        <div className="space-y-2">
                            <Label>Nhà cung cấp</Label>
                            <Combobox
                                value={selectedSupplier?.id || ''}
                                onValueChange={(id, label) => setSelectedSupplier(id ? { id, fields: { supplier_name: label || '' } } : null)}
                                onSearchChange={setSupplierSearchTerm}
                                initialSearchTerm={supplierSearchTerm}
                                placeholder="Tìm hoặc tạo nhà cung cấp..."
                                searchFn={searchSuppliers}
                                createFn={async (name: string) => createSupplier({ supplier_name: name, address: '' })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="import-unit">Đơn vị Nhập</Label>
                                <Select value={importUnitId} onValueChange={setImportUnitId}>
                                    <SelectTrigger id="import-unit"><SelectValue placeholder="Chọn đơn vị..." /></SelectTrigger>
                                    <SelectContent>
                                        {newlyCreatedProduct.unit_conversions.map(unit => (
                                            <SelectItem key={unit.id} value={unit.id}>{unit.fields.name_unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="import-quantity">Số lượng</Label>
                                <Input id="import-quantity" type="number" value={importQuantity} onChange={e => setImportQuantity(e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="import-price">Giá nhập / đơn vị</Label>
                                <Input id="import-price" type="number" value={importPrice} onChange={e => setImportPrice(e.target.value)} placeholder="0" />
                            </div>
                        </div>
                    </div>
                )}

            </CardContent>
            <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                <Button variant="outline" onClick={onCancel} disabled={isPending}>
                    <X className="mr-2 h-4 w-4" /> {showImportSlipForm ? 'Bỏ qua' : 'Hủy'}
                </Button>

                {showImportSlipForm ? (
                    <Button onClick={handleImportSlipSubmit} disabled={isPending || !selectedSupplier || !importUnitId || !importQuantity || !importPrice}>
                        {isSavingImportSlip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Lưu & Nhập kho
                    </Button>
                ) : (
                    <Button onClick={handleCreateProductSubmit} disabled={isPending}>
                        {isSavingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Lưu & Tiếp tục
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

