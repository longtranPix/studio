
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { TranscriptionResponse, EditableOrderItem, CustomerRecord, ProductRecord, CreateOrderAPIPayload, CreateOrderDetailAPIPayload, UnitConversionRecord } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, PlusCircle, Save, X, Search, ChevronDown, User, Package, Hash, CircleDollarSign, Percent, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder } from '@/hooks/use-orders';
import { useFetchUnitConversions } from '@/hooks/use-products';
import { useSearchCustomers, useCreateCustomer } from '@/hooks/use-customers';
import { ProductSearchInput } from '@/components/shared/product-search-input';
import { cn } from '@/lib/utils';
import { usePlanStatus } from '@/hooks/use-plan-status';

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

    // Priority 1: Exact match
    const exactMatch = units.find(u => u.fields.name_unit.toLowerCase() === lowerUnitName);
    if (exactMatch) return exactMatch;

    // Priority 2: Title includes the spoken unit name (e.g., "Lốc 6 chai" includes "lốc")
    const includesMatches = units.filter(u => u.fields.name_unit.toLowerCase().includes(lowerUnitName));
    if (includesMatches.length === 1) return includesMatches[0];
    // If multiple `includes` matches, prefer the shortest one as it's likely the base unit (e.g., "lon" vs "thùng 24 lon")
    if (includesMatches.length > 1) {
        return includesMatches.sort((a, b) => a.fields.name_unit.length - b.fields.name_unit.length)[0];
    }
    
    return null;
}

interface OrderFormProps {
    initialData: TranscriptionResponse | null;
    onCancel: () => void;
}

export function OrderForm({ initialData, onCancel }: OrderFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const itemKeyCounter = useRef(0);
    const { refetchPlanStatus } = usePlanStatus();

    // Main state for the form
    const [items, setItems] = useState<EditableOrderItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Customer search state
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState<CustomerRecord[]>([]);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [noCustomerFound, setNoCustomerFound] = useState(false);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    // New customer state
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    // Hooks
    const { mutateAsync: searchCustomers } = useSearchCustomers();
    const { mutate: fetchUnits } = useFetchUnitConversions();
    const { mutate: createCustomer, isPending: isSavingCustomer } = useCreateCustomer();
    const { mutate: createOrder, isPending: isSavingOrder } = useCreateOrder({
        onSuccess: () => {
            refetchPlanStatus();
            onCancel(); // Reset the main screen
        }
    });
    
    const debouncedCustomerSearch = useDebouncedCallback( (query: string) => {
        if (query && query.length >= 1 && !selectedCustomer) {
            setIsCustomerSearchOpen(true);
            setNoCustomerFound(false);
            setIsSearchingCustomers(true);
            searchCustomers(query).then(data => {
                setCustomerResults(data);
                if (data.length === 0) {
                    setNoCustomerFound(true);
                }
            }).finally(() => {
                setIsSearchingCustomers(false);
            });
        } else {
            setCustomerResults([]);
            setIsCustomerSearchOpen(false);
        }
    }, 300);

    const handleCreateNewCustomer = () => {
        setNewCustomerName(customerSearchTerm);
        setIsCreatingCustomer(true);
        setIsCustomerSearchOpen(false);
    };

    const handleSelectProduct = (index: number, product: ProductRecord) => {
        if (!items[index]) return; 
    
        const initialUnitName = items[index].don_vi_tinh;
        
        handleItemChanges(index, {
            product_id: product.id,
            product_name: product.fields.product_name,
            available_units: [], 
            unit_conversion_id: null, 
            unit_price: null, 
            vat: 0, 
            product_search_term: product.fields.product_name,
            is_fetching_units: true,
            inventory: product.fields.inventory, // Save inventory on product selection
        });

        fetchUnits(product.id, {
            onSuccess: (units) => {
                const matchedUnit = findBestUnitMatch(units, initialUnitName);
                handleItemChanges(index, {
                    available_units: units,
                    unit_conversion_id: matchedUnit ? matchedUnit.id : null,
                    unit_price: matchedUnit ? matchedUnit.fields.price : null,
                    vat: matchedUnit ? matchedUnit.fields.vat_rate ?? 0 : 0,
                    is_fetching_units: false,
                });
            },
            onError: () => handleItemChange(index, 'is_fetching_units', false)
        });
    };

    useEffect(() => {
        if (!initialData) return;
    
        const customerNameToSearch = initialData.customer_name.trim();
        if (customerNameToSearch) {
            setCustomerSearchTerm(customerNameToSearch);
            setIsSearchingCustomers(true);
            searchCustomers(customerNameToSearch).then(data => {
                setCustomerResults(data);
                setIsCustomerSearchOpen(true);
                if (data.length === 1) {
                    handleSelectCustomer(data[0]);
                } else if (data.length === 0) {
                    setNoCustomerFound(true);
                }
            }).finally(() => {
                setIsSearchingCustomers(false);
            });
        }
    
        const initialItems: EditableOrderItem[] = (initialData.extracted || []).map(itemData => ({
            key: `item-${itemKeyCounter.current++}`,
            initial_product_name: itemData.ten_hang_hoa,
            initial_quantity: itemData.so_luong,
            initial_unit_price: itemData.don_gia,
            initial_vat: itemData.vat ?? 0,
            don_vi_tinh: itemData.don_vi_tinh,
            product_search_term: itemData.ten_hang_hoa,
            product_id: null,
            product_name: itemData.ten_hang_hoa,
            available_units: [],
            unit_conversion_id: null,
            unit_price: itemData.don_gia,
            quantity: itemData.so_luong,
            vat: itemData.vat ?? 0,
            is_fetching_units: false,
            inventory: undefined,
        }));
        
        setItems(initialItems);
    
    }, [initialData, searchCustomers]);


    const handleItemChange = (index: number, field: keyof EditableOrderItem, value: any) => {
        setItems(currentItems => {
            const newItems = [...currentItems];
            if(newItems[index]) {
                (newItems[index] as any)[field] = value;
            }
            return newItems;
        });
    };

    const handleItemChanges = (index: number, updates: Partial<EditableOrderItem>) => {
        setItems(currentItems => {
            const newItems = [...currentItems];
            if (newItems[index]) {
                newItems[index] = { ...newItems[index], ...updates };
            }
            return newItems;
        });
    };
    
    const handleSelectCustomer = (customer: CustomerRecord) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.fields.fullname);
        setIsCustomerSearchOpen(false);
        setCustomerResults([]);
    };

    const handleSaveNewCustomer = () => {
        if (!newCustomerName) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên khách hàng.", variant: "destructive" });
            return;
        }
        createCustomer({ fullname: newCustomerName, phone_number: newCustomerPhone }, {
            onSuccess: (newCustomerRecord) => {
                if(newCustomerRecord){
                    handleSelectCustomer(newCustomerRecord.records[0]);
                    setIsCreatingCustomer(false);
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                }
            }
        });
    };

    const orderTotals = useMemo(() => {
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
    const totalAfterVat = orderTotals.totalBeforeVat + orderTotals.totalVatAmount;

    const addItem = () => {
        setItems([
          ...items,
          {
            key: `item-${itemKeyCounter.current++}`,
            initial_product_name: '', initial_quantity: 1, initial_unit_price: 0, initial_vat: 0, don_vi_tinh: '',
            product_search_term: '',
            product_id: null, product_name: '', available_units: [], unit_conversion_id: null,
            unit_price: 0, quantity: 1, vat: 0,
            is_fetching_units: false,
            inventory: undefined,
          },
        ]);
    };
    
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        setSubmitted(true);

        if (!selectedCustomer) {
          toast({ title: 'Lỗi', description: 'Vui lòng chọn hoặc tạo khách hàng.', variant: 'destructive' });
          return;
        }
    
        const order_details: CreateOrderDetailAPIPayload[] = [];
        for(const item of items) {
            if (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null) {
                toast({ title: 'Lỗi', description: `Hàng hoá "${item.product_name || item.initial_product_name}" bị thiếu thông tin. Vui lòng kiểm tra lại.`, variant: 'destructive' });
                return;
            }

            const selectedUnit = item.available_units.find(u => u.id === item.unit_conversion_id);
            const requestedStock = (item.quantity ?? 0) * (selectedUnit?.fields.conversion_factor ?? 1);
            if (typeof item.inventory === 'number' && requestedStock > item.inventory) {
                toast({ title: 'Lỗi Tồn Kho', description: `Sản phẩm "${item.product_name}" không đủ số lượng trong kho.`, variant: 'destructive' });
                return;
            }

            order_details.push({
                product_id: item.product_id,
                unit_conversions_id: item.unit_conversion_id,
                unit_price: item.unit_price,
                quantity: item.quantity,
                vat: item.vat,
            });
        }
    
        if (order_details.length !== items.length) {
            return;
        }

        const payload: CreateOrderAPIPayload = {
          customer_id: selectedCustomer.id,
          order_details,
          delivery_type: 'Xuất bán',
        };
    
        createOrder(payload);
    };

    const isSubmittable = useMemo(() => {
        if (!selectedCustomer) return false;
        if (items.length === 0) return false;
        for (const item of items) {
            if (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null) {
                return false;
            }
             const selectedUnit = item.available_units.find(u => u.id === item.unit_conversion_id);
             const requestedStock = (item.quantity ?? 0) * (selectedUnit?.fields.conversion_factor ?? 1);
             if (typeof item.inventory === 'number' && requestedStock > item.inventory) {
                 return false;
             }
        }
        return true;
    }, [selectedCustomer, items]);

    return (
        <div className="relative">
            {isSavingOrder && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm animate-fade-in-up">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold">Đang lưu đơn hàng...</p>
                </div>
            )}
            <Card className="w-full shadow-lg rounded-xl overflow-hidden border animate-fade-in-up">
                <CardHeader>
                    <CardTitle>Tạo Đơn Hàng Mới</CardTitle>
                    <CardDescription>Kiểm tra thông tin được trích xuất từ giọng nói và hoàn thiện đơn hàng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-semibold text-base">Bản Ghi Âm</Label>
                        <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-inner text-sm">{initialData?.transcription}</p>
                    </div>

                    {/* Customer Section */}
                    <div className="space-y-2">
                        <Label className="flex items-center text-base font-semibold"><User className="mr-2 h-4 w-4 text-primary" />Thông tin khách hàng</Label>
                        {isCreatingCustomer ? (
                            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                <Input placeholder="Tên khách hàng mới" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                                <Input placeholder="Số điện thoại" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingCustomer(false)}>Hủy</Button>
                                    <Button size="sm" onClick={handleSaveNewCustomer} disabled={isSavingCustomer}>
                                        {isSavingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Lưu KH
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className="relative w-full">
                                    <div className="relative">
                                        <Input
                                            placeholder="Tìm hoặc tạo khách hàng..."
                                            value={customerSearchTerm}
                                            onChange={e => {
                                                setCustomerSearchTerm(e.target.value);
                                                setSelectedCustomer(null);
                                                debouncedCustomerSearch(e.target.value);
                                            }}
                                            onFocus={() => { if(customerSearchTerm) setIsCustomerSearchOpen(true)}}
                                            onBlur={() => setTimeout(() => setIsCustomerSearchOpen(false), 150)}
                                            className={cn("pr-8", submitted && !selectedCustomer && "border-destructive")}
                                        />
                                        {isSearchingCustomers ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    {isCustomerSearchOpen && (
                                        <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {customerResults.length > 0 ? (
                                                customerResults.map(c => (
                                                    <div key={c.id} onMouseDown={() => handleSelectCustomer(c)} className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between">
                                                        <p className="font-medium">
                                                            {c.fields.fullname}
                                                            {c.fields.phone_number && <span className="text-muted-foreground font-normal"> - ***{c.fields.phone_number.slice(-3)}</span>}
                                                        </p>
                                                        {selectedCustomer?.id === c.id && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                ))
                                            ) : (
                                                noCustomerFound && !isSearchingCustomers &&
                                                <div onMouseDown={handleCreateNewCustomer} className="p-2 text-sm text-center text-muted-foreground hover:bg-accent cursor-pointer">
                                                    Không có khách hàng nào phù hợp. Nhấn để tạo mới.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleCreateNewCustomer}><UserPlus className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {selectedCustomer && !isCustomerSearchOpen && (
                            <div className="p-2 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-md text-sm dark:bg-green-900/30 dark:text-green-300">
                                Đã chọn: <span className="font-semibold">{selectedCustomer.fields.fullname}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Chi tiết đơn hàng</Label>
                        {items.map((item, index) => {
                            const isItemInvalid = submitted && (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null);
                            
                            const selectedUnit = item.available_units.find(u => u.id === item.unit_conversion_id);
                            const requestedStock = (item.quantity ?? 0) * (selectedUnit?.fields.conversion_factor ?? 1);
                            const hasEnoughStock = typeof item.inventory !== 'number' || requestedStock <= item.inventory;
                            const baseUnitName = item.available_units.find(u => u.fields.conversion_factor === 1)?.fields.unit_default || 'đơn vị';

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
                                                                unit_price: selectedUnit ? selectedUnit.fields.price : null,
                                                                vat: selectedUnit ? selectedUnit.fields.vat_rate ?? 0: 0,
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
                                                {!hasEnoughStock && (
                                                    <p className="text-xs text-red-600 font-medium pt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3.5 w-3.5"/>
                                                        Tồn kho chỉ còn {item.inventory} {baseUnitName}, không đủ để xuất.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><CircleDollarSign className="mr-2 h-4 w-4" />Đơn giá</Label>
                                                <Input type="number" value={String(item.unit_price ?? '')} onChange={e => handleItemChange(index, 'unit_price', e.target.value === '' ? null : Number(e.target.value))} />
                                                {item.unit_price != null && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(item.unit_price)}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="flex items-center text-sm font-medium"><Percent className="mr-2 h-4 w-4" />Thuế GTGT (%)</Label>
                                                <Input type="number" value={String(item.vat)} onChange={e => handleItemChange(index, 'vat', e.target.value === '' ? 0 : Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                         <Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-2 h-4 w-4" /> Thêm hàng hóa</Button>
                    </div>

                    {/* Order Summary & Actions */}
                     <div className="pt-6 mt-6 border-t-2 border-dashed">
                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between"><span>Tổng tiền hàng (trước thuế):</span><span className="font-semibold">{formatCurrency(orderTotals.totalBeforeVat)}</span></div>
                            <div className="flex justify-between"><span>Tổng tiền thuế GTGT:</span><span className="font-semibold">{formatCurrency(orderTotals.totalVatAmount)}</span></div>
                            <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t"><span>Tổng cộng thanh toán:</span><span>{formatCurrency(totalAfterVat)}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 bg-muted/30 p-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSavingOrder}><X className="mr-2 h-4 w-4" /> Hủy</Button>
                    <Button onClick={handleSubmit} disabled={isSavingOrder || !isSubmittable}>
                        {isSavingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Xác nhận & Lưu
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
