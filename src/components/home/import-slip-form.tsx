
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
import { Loader2, Trash2, PlusCircle, Save, X, Search, ChevronDown, User, Package, Hash, CircleDollarSign, Percent, Check, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateImportSlip } from '@/hooks/use-orders';
import { useSearchProducts, useFetchUnitConversions } from '@/hooks/use-products';
import { useSearchSuppliers } from '@/hooks/use-suppliers';
import { cn } from '@/lib/utils';

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return '';
  return `${value.toLocaleString('vi-VN')} VND`;
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
    const hasAutoSelected = useRef<Set<string>>(new Set());

    // Main state for the form
    const [items, setItems] = useState<EditableOrderItem[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);

    // Supplier search state
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierResults, setSupplierResults] = useState<SupplierRecord[]>([]);
    const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

    // Hooks
    const { mutate: searchSuppliers, isPending: isSearchingSuppliers } = useSearchSuppliers();
    const { mutateAsync: searchProductsAsync } = useSearchProducts();
    const { mutate: fetchUnits } = useFetchUnitConversions();
    const { mutate: createImportSlip, isPending: isSaving } = useCreateImportSlip();
    
    const debouncedSupplierSearch = useDebouncedCallback((query: string) => {
        if (query && query.length >= 1 && !selectedSupplier) {
            setIsSupplierSearchOpen(true);
            searchSuppliers(query, {
                onSuccess: (data) => setSupplierResults(data),
            });
        } else {
            setSupplierResults([]);
            setIsSupplierSearchOpen(false);
        }
    }, 300);

    const debouncedProductSearch = useDebouncedCallback((index: number, query: string) => {
        if (query) {
            handleItemChanges(index, { is_searching_product: true, is_product_search_open: true });
            searchProductsAsync(query).then(results => {
                handleItemChange(index, 'product_search_results', results || []);
            }).finally(() => {
                handleItemChange(index, 'is_searching_product', false);
            });
        } else {
            handleItemChanges(index, { product_search_results: [], is_product_search_open: false });
        }
    }, 300);

    const handleSelectProduct = (index: number, product: ProductRecord) => {
        if (!items[index]) return;
    
        const initialUnitName = items[index].don_vi_tinh;
        
        handleItemChanges(index, {
            product_id: product.id,
            product_name: product.fields.product_name,
            available_units: [], 
            unit_conversion_id: null, 
            unit_price: null, 
            vat: null, 
            product_search_term: product.fields.product_name,
            is_product_search_open: false,
            product_search_results: [],
            is_fetching_units: true,
        });

        fetchUnits(product.id, {
            onSuccess: (units) => {
                const matchedUnit = findBestUnitMatch(units, initialUnitName);
                handleItemChanges(index, {
                    available_units: units,
                    unit_conversion_id: matchedUnit ? matchedUnit.id : null,
                    unit_price: matchedUnit ? matchedUnit.fields.price : null,
                    vat: matchedUnit ? matchedUnit.fields.vat_rate : null,
                    is_fetching_units: false,
                });
            },
            onError: () => handleItemChange(index, 'is_fetching_units', false)
        });
    };

    useEffect(() => {
        if (!initialData) return;
    
        const supplierNameToSearch = initialData.supplier_name.trim();
        setSupplierSearchTerm(supplierNameToSearch);
        if (supplierNameToSearch) {
            searchSuppliers(supplierNameToSearch, {
                onSuccess: (data) => {
                    setSupplierResults(data);
                    setIsSupplierSearchOpen(true);
                    if (data.length === 1) {
                        handleSelectSupplier(data[0]);
                    }
                }
            });
        }
    
        const processInitialItems = async () => {
            if (!initialData?.extracted) return;
    
            const initialItems: EditableOrderItem[] = initialData.extracted.map(itemData => ({
                key: `item-${itemKeyCounter.current++}`,
                initial_product_name: itemData.ten_hang_hoa,
                initial_quantity: itemData.so_luong,
                initial_unit_price: itemData.don_gia,
                initial_vat: itemData.vat,
                don_vi_tinh: itemData.don_vi_tinh,
                product_search_term: itemData.ten_hang_hoa,
                product_search_results: [],
                is_searching_product: false, is_product_search_open: false, is_fetching_units: false,
                product_id: null, product_name: itemData.ten_hang_hoa, available_units: [],
                unit_conversion_id: null, unit_price: itemData.don_gia,
                quantity: itemData.so_luong, vat: itemData.vat,
            }));
            
            setItems(initialItems);

            const updatedItems = await Promise.all(initialItems.map(async (item, index) => {
                if (item.product_search_term && !hasAutoSelected.current.has(item.key)) {
                    try {
                        const results = await searchProductsAsync(item.product_search_term);
                        if (results && results.length === 1) {
                             hasAutoSelected.current.add(item.key);
                            return { index, product: results[0] };
                        }
                    } catch (e) { console.error("Error auto-searching product", e); }
                }
                return null;
            }));

            updatedItems.forEach(result => {
                if (result) handleSelectProduct(result.index, result.product);
            });
        };
    
        processInitialItems();
    }, [initialData, searchSuppliers, searchProductsAsync]);


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
    
    const handleProductSearchChange = (index: number, query: string) => {
        handleItemChanges(index, { product_search_term: query, product_id: null, is_product_search_open: true });
        debouncedProductSearch(index, query);
    };

    const handleSelectSupplier = (supplier: SupplierRecord) => {
        setSelectedSupplier(supplier);
        setSupplierSearchTerm(supplier.fields.supplier_name);
        setIsSupplierSearchOpen(false);
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
            product_search_term: '', product_search_results: [], is_searching_product: false,
            is_product_search_open: false, product_id: null, product_name: '', available_units: [],
            unit_conversion_id: null, unit_price: 0, quantity: 1, vat: 0, is_fetching_units: false,
        }]);
    };
    
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
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
          import_slip_details,
          import_type: 'Nhập mua',
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
                        <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{transcription}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center text-base font-semibold"><Truck className="mr-2 h-4 w-4 text-primary" />Thông tin nhà cung cấp</Label>
                        <div className="relative w-full">
                            <div className="relative">
                                <Input
                                    placeholder="Tìm nhà cung cấp..."
                                    value={supplierSearchTerm}
                                    onChange={e => {
                                        setSupplierSearchTerm(e.target.value);
                                        setSelectedSupplier(null);
                                        debouncedSupplierSearch(e.target.value);
                                    }}
                                    onFocus={() => { if(supplierSearchTerm) setIsSupplierSearchOpen(true)}}
                                    onBlur={() => setTimeout(() => setIsSupplierSearchOpen(false), 150)}
                                    className="pr-8"
                                />
                                {isSearchingSuppliers ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                            </div>
                            {isSupplierSearchOpen && (
                                 <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {supplierResults.length > 0 ? (
                                        supplierResults.map(s => (
                                            <div key={s.id} onMouseDown={() => handleSelectSupplier(s)} className="p-2 hover:bg-accent cursor-pointer">
                                                 <p className="font-medium">{s.fields.supplier_name}</p>
                                                 {s.fields.address && <p className="text-sm text-muted-foreground">{s.fields.address}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        !isSearchingSuppliers && supplierSearchTerm &&
                                        <div className="p-2 text-sm text-center text-muted-foreground">Không có nhà cung cấp nào phù hợp</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedSupplier && (
                            <div className="p-2 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-md text-sm">
                                Đã chọn: <span className="font-semibold">{selectedSupplier.fields.supplier_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Chi tiết phiếu nhập</Label>
                        {items.map((item, index) => (
                            <div key={item.key} className="border p-4 rounded-lg shadow-sm bg-gray-50 space-y-4 relative">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1 relative">
                                        <Label className="flex items-center text-sm font-medium"><Package className="mr-2 h-4 w-4" />Tên hàng hóa</Label>
                                        <div className="relative">
                                            <Input 
                                                value={item.product_search_term} 
                                                onChange={e => handleProductSearchChange(index, e.target.value)}
                                                onFocus={() => handleItemChange(index, 'is_product_search_open', true)}
                                                onBlur={() => setTimeout(() => handleItemChange(index, 'is_product_search_open', false), 150)}
                                            />
                                            {item.is_searching_product ? 
                                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : 
                                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            }
                                        </div>
                                        {item.is_product_search_open && (
                                             <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {item.product_search_results.length > 0 ? (
                                                    item.product_search_results.map(p => (
                                                        <div 
                                                            key={p.id} 
                                                            onMouseDown={() => handleSelectProduct(index, p)} 
                                                            className="p-2 hover:bg-accent cursor-pointer text-sm flex items-center justify-between"
                                                        >
                                                            <span>{p.fields.product_name}</span>
                                                            {item.product_id === p.id && <Check className="h-4 w-4 text-primary" />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    !item.is_searching_product && <div className="p-2 text-sm text-center text-muted-foreground">Không tìm thấy sản phẩm</div>
                                                )}
                                            </div>
                                        )}
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
                                                        unit_price: selectedUnit ? selectedUnit.fields.price : null,
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
                                        <Label className="flex items-center text-sm font-medium"><CircleDollarSign className="mr-2 h-4 w-4" />Đơn giá (VND)</Label>
                                        <Input type="number" value={String(item.unit_price ?? '')} onChange={e => handleItemChange(index, 'unit_price', e.target.value === '' ? null : Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="flex items-center text-sm font-medium"><Percent className="mr-2 h-4 w-4" />Thuế GTGT (%)</Label>
                                        <Input type="number" value={String(item.vat ?? '')} onChange={e => handleItemChange(index, 'vat', e.target.value === '' ? null : Number(e.target.value))} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
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
                    <Button onClick={handleSubmit} disabled={isSaving || !selectedSupplier}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Xác nhận & Lưu
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
