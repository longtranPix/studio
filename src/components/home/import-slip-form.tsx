
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { ImportSlipData, EditableOrderItem, SupplierRecord, ProductRecord, CreateImportSlipPayload, CreateImportSlipDetailPayload, UnitConversionRecord } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, PlusCircle, Save, X, Search, ChevronDown, Check, Truck, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateImportSlip } from '@/hooks/use-orders';
import { useFetchUnitConversions } from '@/hooks/use-products';
import { useSearchSuppliers, useCreateSupplier } from '@/hooks/use-suppliers';
import { ProductSearchInput } from '@/components/shared/product-search-input';
import { Package, Hash, CircleDollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return '0 VND';
  return `${value.toLocaleString('de-DE')} VND`;
};

// Helper to find the best unit match from voice input
const findBestUnitMatch = (units: UnitConversionRecord[], unitName: string | null): UnitConversionRecord | null => {
    if (!unitName || !units || units.length === 0) return null;
    const lowerUnitName = unitName.toLowerCase().trim();
    if (!lowerUnitName) return null;

    const exactMatch = units.find(u => u.fields.name_unit.toLowerCase() === lowerUnitName);
    if (exactMatch) return exactMatch;

    const includesMatches = units.filter(u => u.fields.name_unit.toLowerCase().includes(lowerUnitName));
    if (includesMatches.length === 1) return includesMatches[0];
    if (includesMatches.length > 1) {
        return includesMatches.sort((a, b) => a.fields.name_unit.length - b.fields.name_unit.length)[0];
    }
    
    return null;
}

interface ImportSlipFormProps {
    initialData: ImportSlipData | null;
    onCancel: () => void;
    transcription: string;
}

export function ImportSlipForm({ initialData, onCancel, transcription }: ImportSlipFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const itemKeyCounter = useRef(0);

    // Main state for the form
    const [items, setItems] = useState<EditableOrderItem[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Supplier search state
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierResults, setSupplierResults] = useState<SupplierRecord[]>([]);
    const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
    const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
    
    // New supplier state
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierAddress, setNewSupplierAddress] = useState('');


    // Hooks
    const { mutateAsync: searchSuppliers } = useSearchSuppliers();
    const { mutate: fetchUnits } = useFetchUnitConversions();
    const { mutate: createSupplier, isPending: isSavingSupplier } = useCreateSupplier();
    const { mutate: createImportSlip, isPending: isSaving } = useCreateImportSlip();
    
    const debouncedSupplierSearch = useDebouncedCallback((query: string) => {
        if (query && query.length >= 1 && !selectedSupplier) {
            setIsSupplierSearchOpen(true);
            setIsSearchingSuppliers(true);
            searchSuppliers(query).then(data => {
                setSupplierResults(data);
            }).finally(() => {
                setIsSearchingSuppliers(false);
            });
        } else {
            setSupplierResults([]);
            setIsSupplierSearchOpen(false);
        }
    }, 300);

    const handleSelectProduct = (index: number, product: ProductRecord) => {
        if (!items[index]) return;
    
        const initialUnitName = items[index].don_vi_tinh;
        // Keep the price from voice input, as it's the cost price for this import.
        const costPrice = items[index].initial_unit_price;
    
        handleItemChanges(index, {
            product_id: product.id,
            product_name: product.fields.product_name,
            available_units: [],
            unit_conversion_id: null,
            // DO NOT update unit_price from standard price, keep the voice-input cost price
            // unit_price: null, 
            vat: null,
            product_search_term: product.fields.product_name,
            is_fetching_units: true,
        });
    
        fetchUnits(product.id, {
            onSuccess: (units) => {
                const matchedUnit = findBestUnitMatch(units, initialUnitName);
                handleItemChanges(index, {
                    available_units: units,
                    unit_conversion_id: matchedUnit ? matchedUnit.id : null,
                    // IMPORTANT FOR IMPORT SLIP:
                    // The price is the COST PRICE from the supplier for THIS transaction,
                    // which is what the user dictated. DO NOT use the product's standard sale price.
                    // The 'unit_price' is already set to 'initial_unit_price' from the AI.
                    // If the AI didn't catch a price, it will be null, and the user must enter it.
                    unit_price: costPrice,
                    vat: matchedUnit ? matchedUnit.fields.vat_rate : items[index].initial_vat, // Use unit VAT if available, otherwise fallback to voice VAT
                    is_fetching_units: false,
                });
            },
            onError: () => handleItemChange(index, 'is_fetching_units', false)
        });
    };

    useEffect(() => {
        if (!initialData) return;
    
        const supplierNameToSearch = initialData.supplier_name.trim();
        if (supplierNameToSearch) {
             setSupplierSearchTerm(supplierNameToSearch);
             setIsSearchingSuppliers(true);
            searchSuppliers(supplierNameToSearch).then(data => {
                setSupplierResults(data);
                setIsSupplierSearchOpen(true);
                if (data.length === 1) {
                    handleSelectSupplier(data[0]);
                }
            }).finally(() => {
                setIsSearchingSuppliers(false);
            });
        }
    
        const initialItems: EditableOrderItem[] = (initialData.extracted || []).map(itemData => ({
            key: `item-${itemKeyCounter.current++}`,
            initial_product_name: itemData.ten_hang_hoa,
            initial_quantity: itemData.so_luong,
            initial_unit_price: itemData.don_gia,
            initial_vat: itemData.vat,
            don_vi_tinh: itemData.don_vi_tinh,
            product_search_term: itemData.ten_hang_hoa,
            product_id: null,
            product_name: itemData.ten_hang_hoa,
            available_units: [],
            unit_conversion_id: null,
            unit_price: itemData.don_gia,
            quantity: itemData.so_luong,
            vat: itemData.vat,
            is_fetching_units: false,
        }));
        
        setItems(initialItems);

    }, [initialData, searchSuppliers]);


    const handleItemChange = (index: number, field: keyof EditableOrderItem, value: any) => {
        setItems(currentItems => {
            const newItems = [...currentItems];
            if(newItems[index]) { (newItems[index] as any)[field] = value; }
            return newItems;
        });
    };

    const handleItemChanges = (index: number, updates: Partial<EditableOrderItem>) => {
        setItems(currentItems => {
            const newItems = [...currentItems];
            if (newItems[index]) { newItems[index] = { ...newItems[index], ...updates }; }
            return newItems;
        });
    };
    
    const handleSelectSupplier = (supplier: SupplierRecord) => {
        setSelectedSupplier(supplier);
        setSupplierSearchTerm(supplier.fields.supplier_name);
        setIsSupplierSearchOpen(false);
        setSupplierResults([]);
    };
    
    const handleCreateNewSupplier = () => {
        setNewSupplierName(supplierSearchTerm);
        setIsCreatingSupplier(true);
        setIsSupplierSearchOpen(false);
    };
    
    const handleSaveNewSupplier = () => {
        if (!newSupplierName) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên nhà cung cấp.", variant: "destructive" });
            return;
        }
        createSupplier({ supplier_name: newSupplierName, address: newSupplierAddress }, {
            onSuccess: (newSupplierRecord) => {
                if(newSupplierRecord && newSupplierRecord.records.length > 0){
                    handleSelectSupplier(newSupplierRecord.records[0]);
                    setIsCreatingSupplier(false);
                    setNewSupplierName('');
                    setNewSupplierAddress('');
                }
            }
        });
    };


    const slipTotals = useMemo(() => {
        return items.reduce(
          (acc, item) => {
            const quantity = item.quantity ?? 0;
            const unitPrice = item.unit_price ?? 0;
            const vatRate = item.vat ?? 0;
            const itemTotal = quantity * unitPrice;
            const vatAmount = itemTotal * (vatRate / 100);
            acc.totalBeforeVat += itemTotal;
            acc.totalVatAmount += vatAmount;
            return acc;
          },
          { totalBeforeVat: 0, totalVatAmount: 0 }
        );
    }, [items]);
    const totalAfterVat = slipTotals.totalBeforeVat + slipTotals.totalVatAmount;

    const addItem = () => {
        setItems([...items, {
            key: `item-${itemKeyCounter.current++}`,
            initial_product_name: '', initial_quantity: 1, initial_unit_price: 0, initial_vat: 0, don_vi_tinh: '',
            product_search_term: '',
            product_id: null, product_name: '', available_units: [],
            unit_conversion_id: null, unit_price: 0, quantity: 1, vat: 0, is_fetching_units: false,
        }]);
    };
    
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        setSubmitted(true);

        if (!selectedSupplier) {
          toast({ title: 'Lỗi', description: 'Vui lòng chọn nhà cung cấp.', variant: 'destructive' });
          return;
        }
    
        const import_slip_details: CreateImportSlipDetailPayload[] = [];
        for(const item of items) {
            if (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null) {
                toast({ title: 'Lỗi', description: `Hàng hoá "${item.product_name || item.initial_product_name}" bị thiếu thông tin. Vui lòng kiểm tra lại.`, variant: 'destructive' });
                return;
            }
            import_slip_details.push({
                product_id: item.product_id,
                unit_conversions_id: item.unit_conversion_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                vat: item.vat,
            });
        }
    
        if (import_slip_details.length !== items.length) return;

        const payload: CreateImportSlipPayload = {
          supplier_id: selectedSupplier.id,
          import_type: 'Nhập mua',
          import_slip_details,
        };
    
        createImportSlip(payload, {
          onSuccess: () => {
            onCancel(); // Reset the main screen
          }
        });
    };

    return (
        <div className="relative">
            {isSaving && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm animate-fade-in-up">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold">Đang lưu phiếu nhập...</p>
                </div>
            )}
            <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center"><Truck className="mr-2"/> Tạo Phiếu Nhập Kho</CardTitle>
                    <CardDescription>Kiểm tra thông tin được trích xuất từ giọng nói và hoàn thiện phiếu nhập.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                        <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-inner text-sm">{transcription}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center text-base font-semibold"><Truck className="mr-2 h-4 w-4 text-primary" />Thông tin nhà cung cấp</Label>
                        {isCreatingSupplier ? (
                             <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                <Input placeholder="Tên nhà cung cấp mới" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} className={cn(submitted && !newSupplierName && "border-destructive")} />
                                <Input placeholder="Địa chỉ (không bắt buộc)" value={newSupplierAddress} onChange={(e) => setNewSupplierAddress(e.target.value)} />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingSupplier(false)}>Hủy</Button>
                                    <Button size="sm" onClick={handleSaveNewSupplier} disabled={isSavingSupplier}>
                                        {isSavingSupplier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Lưu NCC
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className="relative w-full">
                                        <div className="relative">
                                            <Input
                                                placeholder="Tìm hoặc tạo nhà cung cấp..."
                                                value={supplierSearchTerm}
                                                onChange={e => {
                                                    setSupplierSearchTerm(e.target.value);
                                                    setSelectedSupplier(null);
                                                    debouncedSupplierSearch(e.target.value);
                                                }}
                                                onFocus={() => { if(supplierSearchTerm) setIsSupplierSearchOpen(true)}}
                                                onBlur={() => setTimeout(() => setIsSupplierSearchOpen(false), 150)}
                                                className={cn("pr-8", submitted && !selectedSupplier && "border-destructive")}
                                            />
                                            {isSearchingSuppliers ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                                        </div>
                                        {isSupplierSearchOpen && (
                                            <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {supplierResults.length > 0 ? (
                                                    supplierResults.map(s => (
                                                        <div key={s.id} onMouseDown={() => handleSelectSupplier(s)} className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">{s.fields.supplier_name}</p>
                                                                {s.fields.address && <p className="text-sm text-muted-foreground">{s.fields.address}</p>}
                                                            </div>
                                                            {selectedSupplier?.id === s.id && <Check className="h-4 w-4 text-primary" />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    !isSearchingSuppliers && supplierSearchTerm &&
                                                    <div onMouseDown={handleCreateNewSupplier} className="p-2 text-sm text-center text-muted-foreground hover:bg-accent cursor-pointer">Không có nhà cung cấp nào. Nhấn để tạo mới.</div>
                                                )}
                                            </div>
                                        )}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleCreateNewSupplier}><Plus className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {selectedSupplier && !isSupplierSearchOpen && (
                            <div className="p-2 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-md text-sm dark:bg-green-900/30 dark:text-green-300">
                                Đã chọn: <span className="font-semibold">{selectedSupplier.fields.supplier_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Chi tiết phiếu nhập</Label>
                        {items.length === 0 ? (
                           <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                                <p>Chưa có hàng hóa nào trong phiếu. Vui lòng thêm một hàng hóa.</p>
                           </div>
                        ) : (
                        items.map((item, index) => {
                            const isItemInvalid = submitted && (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null);
                            return (
                                <div key={item.key} className="relative pt-4">
                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 z-10 text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4 transition-colors", isItemInvalid && "border-destructive bg-destructive/5")}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1 relative">
                                                <Label className="flex items-center text-sm font-medium"><Package className="mr-2 h-4 w-4" />Tên hàng hóa</Label>
                                                <ProductSearchInput
                                                    value={item.product_search_term}
                                                    initialSearchTerm={item.initial_product_name}
                                                    selectedProductId={item.product_id}
                                                    onSearchTermChange={(term) => handleItemChanges(index, { product_search_term: term, product_id: null })}
                                                    onProductSelect={(product) => handleSelectProduct(index, product)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><ChevronDown className="mr-2 h-4 w-4" />Đơn vị tính</Label>
                                                <div className="relative">
                                                    <Select
                                                        value={item.unit_conversion_id ?? ''}
                                                        onValueChange={(unitId) => {
                                                            const selectedUnit = items[index].available_units.find(u => u.id === unitId);
                                                            handleItemChanges(index, {
                                                                unit_conversion_id: unitId,
                                                                vat: selectedUnit ? selectedUnit.fields.vat_rate : null,
                                                            });
                                                        }}
                                                        disabled={!item.product_id || item.is_fetching_units}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={item.is_fetching_units ? 'Đang tải...' : 'Chọn ĐVT...'} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {item.available_units.map(unit => (
                                                                <SelectItem key={unit.id} value={unit.id}>{unit.fields.name_unit}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {item.is_fetching_units && <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><Hash className="mr-2 h-4 w-4" />Số lượng</Label>
                                                <Input type="number" value={String(item.quantity ?? '')} onChange={e => handleItemChange(index, 'quantity', e.target.value === '' ? null : Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><CircleDollarSign className="mr-2 h-4 w-4" />Đơn giá</Label>
                                                <Input type="number" value={String(item.unit_price ?? '')} onChange={e => handleItemChange(index, 'unit_price', e.target.value === '' ? null : Number(e.target.value))} />
                                                {item.unit_price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(item.unit_price)}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><Percent className="mr-2 h-4 w-4" />Thuế GTGT (%)</Label>
                                                <Input type="number" value={String(item.vat ?? '')} onChange={e => handleItemChange(index, 'vat', e.target.value === '' ? null : Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }))}
                         <Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-2 h-4 w-4" /> Thêm hàng hóa</Button>
                    </div>

                    <div className="pt-6 mt-6 border-t-2 border-dashed">
                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between"><span>Tổng tiền hàng (trước thuế):</span><span className="font-semibold">{formatCurrency(slipTotals.totalBeforeVat)}</span></div>
                            <div className="flex justify-between"><span>Tổng tiền thuế GTGT:</span><span className="font-semibold">{formatCurrency(slipTotals.totalVatAmount)}</span></div>
                            <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t"><span>Tổng cộng thanh toán:</span><span>{formatCurrency(totalAfterVat)}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}><X className="mr-2 h-4 w-4" /> Hủy</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Xác nhận & Lưu
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
