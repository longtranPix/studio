
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import type { TranscriptionResponse, EditableOrderItem, CustomerRecord, ProductRecord, CreateOrderAPIPayload, CreateOrderDetailAPIPayload } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, PlusCircle, Save, X, Search, ChevronDown, User, Package, Hash, CircleDollarSign, Percent } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder } from '@/hooks/use-orders';
import { useSearchProducts } from '@/hooks/use-products';
import { useSearchCustomers, useCreateCustomer } from '@/hooks/use-customers';

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return '';
  return `${value.toLocaleString('vi-VN')} VND`;
};

interface OrderFormProps {
    initialData: TranscriptionResponse | null;
    audioBlob: Blob | null;
    onCancel: () => void;
}

export function OrderForm({ initialData, audioBlob, onCancel }: OrderFormProps) {
    const router = useRouter();
    const { toast } = useToast();

    // Main state for the form
    const [items, setItems] = useState<EditableOrderItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
    const [notes, setNotes] = useState('');

    // Customer search state
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const debouncedCustomerSearch = useDebouncedCallback( (query: string) => {
        if (query && query.length > 2 && !selectedCustomer) {
            setIsCustomerSearchOpen(true);
            searchCustomers(query, {
                onSuccess: setCustomerResults,
            });
        } else {
            setCustomerResults([]);
            setIsCustomerSearchOpen(false);
        }
    }, 300);
    const [customerResults, setCustomerResults] = useState<CustomerRecord[]>([]);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

    // New customer state
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    // Hooks
    const { mutate: searchCustomers, isPending: isSearchingCustomers } = useSearchCustomers();
    const { mutate: searchProducts } = useSearchProducts();
    const { mutate: createCustomer, isPending: isSavingCustomer } = useCreateCustomer();
    const { mutate: createOrder, isPending: isSavingOrder } = useCreateOrder();
    
    // Product search debounce
    const debouncedProductSearch = useDebouncedCallback((index: number, query: string) => {
        if (query) {
            handleItemChanges(index, { is_searching_product: true, is_product_search_open: true });
            searchProducts(query, {
                onSuccess: (results) => {
                    handleItemChange(index, 'product_search_results', results);
                },
                onSettled: () => {
                    handleItemChange(index, 'is_searching_product', false);
                }
            });
        } else {
            handleItemChanges(index, { product_search_results: [], is_product_search_open: false });
        }
    }, 300);


    // Initialize form state from AI data
    useEffect(() => {
        if (!initialData) return;
    
        // Customer setup
        setCustomerSearchTerm(initialData.customer_name);
        if (initialData.customer_name.trim()) {
            searchCustomers(initialData.customer_name, {
                onSuccess: (data) => {
                    setCustomerResults(data);
                    if (data.length > 0) setIsCustomerSearchOpen(true);
                    if (data.length === 1) {
                        handleSelectCustomer(data[0]);
                    }
                }
            });
        }
    
        // Items setup
        const newItems = (initialData.extracted || []).map((item, index) => {
            const newItemState: EditableOrderItem = {
                key: `item-${index}-${Date.now()}`,
                initial_product_name: item.ten_hang_hoa,
                initial_quantity: item.so_luong,
                initial_unit_price: item.don_gia,
                initial_vat: item.vat,
                product_search_term: item.ten_hang_hoa,
                product_search_results: [],
                is_searching_product: !!item.ten_hang_hoa,
                is_product_search_open: false,
                product_id: null,
                product_name: item.ten_hang_hoa,
                available_units: [],
                unit_conversion_id: null,
                unit_price: item.don_gia,
                quantity: item.so_luong,
                vat: item.vat,
            };
    
            if (item.ten_hang_hoa) {
                searchProducts(item.ten_hang_hoa, {
                    onSuccess: (results) => {
                        setItems(currentItems => {
                            const updatedItems = [...currentItems];
                            const targetItem = updatedItems[index];
                            if (!targetItem) return currentItems;
    
                            let updates: Partial<EditableOrderItem> = { 
                                product_search_results: results, 
                                is_searching_product: false 
                            };
    
                            if (results.length === 1) {
                                const product = results[0];
                                const productUpdates = {
                                    product_id: product.id,
                                    product_name: product.fields.product_name,
                                    available_units: product.fields.unit_conversions,
                                    product_search_term: product.fields.product_name,
                                    product_search_results: [],
                                };
                                updates = {...updates, ...productUpdates};

                                const initialUnitName = item.don_vi_tinh;
                                if (initialUnitName) {
                                    const matchedUnit = product.fields.unit_conversions.find(u => 
                                        u.title.toLowerCase() === initialUnitName.toLowerCase()
                                    );
                                    if (matchedUnit) {
                                        updates.unit_conversion_id = matchedUnit.id;
                                        updates.unit_price = matchedUnit.fields.price;
                                        updates.vat = matchedUnit.fields.vat;
                                    }
                                }
                            }
    
                            updatedItems[index] = { ...targetItem, ...updates };
                            return updatedItems;
                        });
                    },
                    onError: () => {
                        setItems(currentItems => {
                            const updatedItems = [...currentItems];
                            if(updatedItems[index]) updatedItems[index].is_searching_product = false;
                            return updatedItems;
                        })
                    }
                });
            }
    
            return newItemState;
        });
    
        setItems(newItems);
    
    }, [initialData, searchCustomers, searchProducts]);

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
    
    // Product search
    const handleProductSearchChange = (index: number, query: string) => {
        handleItemChanges(index, {
            product_search_term: query,
            product_id: null, // Reset product if user is typing a new search
        });
        debouncedProductSearch(index, query);
    };

    const handleSelectProduct = (index: number, product: ProductRecord) => {
        handleItemChanges(index, {
            product_id: product.id,
            product_name: product.fields.product_name,
            available_units: product.fields.unit_conversions,
            unit_conversion_id: null, 
            unit_price: null, 
            vat: null, 
            product_search_results: [], 
            product_search_term: product.fields.product_name,
            is_product_search_open: false,
        });
    };

    const handleSelectCustomer = (customer: CustomerRecord) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.fields.fullname);
        setIsCustomerSearchOpen(false);
    };

    const handleSaveNewCustomer = () => {
        if (!newCustomerName || !newCustomerPhone) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên và số điện thoại khách hàng.", variant: "destructive" });
            return;
        }
        createCustomer({ fullname: newCustomerName, phone_number: newCustomerPhone }, {
            onSuccess: (data) => {
                if(data.record){
                    handleSelectCustomer(data.record);
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
            key: `item-${items.length}-${Date.now()}`,
            initial_product_name: '', initial_quantity: 1, initial_unit_price: 0, initial_vat: 0,
            product_search_term: '', product_search_results: [], is_searching_product: false,
            is_product_search_open: false,
            product_id: null, product_name: '', available_units: [], unit_conversion_id: null,
            unit_price: 0, quantity: 1, vat: 0,
          },
        ]);
    };
    
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!selectedCustomer) {
          toast({ title: 'Lỗi', description: 'Vui lòng chọn hoặc tạo khách hàng.', variant: 'destructive' });
          return;
        }
    
        const order_details: CreateOrderDetailAPIPayload[] = [];
        for(const item of items) {
            if (!item.product_id || !item.unit_conversion_id || item.quantity == null || item.unit_price == null || item.vat == null) {
                toast({ title: 'Lỗi', description: `Hàng hoá "${item.product_name}" bị thiếu thông tin. Vui lòng kiểm tra lại.`, variant: 'destructive' });
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

        const payload: Omit<CreateOrderAPIPayload, 'order_table_id' | 'detail_table_id'> = {
          customer_id: selectedCustomer.id,
          order_details,
          delivery_type: 'Xuất bán',
          notes: notes,
        };
    
        createOrder(payload, {
          onSuccess: () => {
            router.push('/history');
          }
        });
    };

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
                        <p className="mt-2 whitespace-pre-wrap p-3 sm:p-4 bg-gray-100 rounded-md shadow-inner text-sm">{initialData?.transcription}</p>
                    </div>

                    {/* Customer Section */}
                    <div className="space-y-2">
                        <Label className="flex items-center text-base font-semibold"><User className="mr-2 h-4 w-4 text-primary" />Thông tin khách hàng</Label>
                        {isCreatingCustomer ? (
                            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
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
                                <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                                    <PopoverTrigger asChild className="w-full">
                                        <div className="relative">
                                            <Input
                                                placeholder="Tìm hoặc tạo khách hàng..."
                                                value={customerSearchTerm}
                                                onChange={e => {
                                                    setCustomerSearchTerm(e.target.value);
                                                    setSelectedCustomer(null);
                                                    debouncedCustomerSearch(e.target.value);
                                                }}
                                                className="pr-8"
                                            />
                                            {isSearchingCustomers ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        {customerResults.length > 0 ? (
                                            customerResults.map(c => (
                                                <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-2 hover:bg-accent cursor-pointer">
                                                     <p className="font-medium">
                                                        {c.fields.fullname}
                                                        {c.fields.phone_number && <span className="text-muted-foreground font-normal"> - ***{c.fields.phone_number.slice(-3)}</span>}
                                                    </p>
                                                </div>
                                            ))
                                        ) : <p className="p-2 text-sm text-center text-muted-foreground">Không tìm thấy khách hàng</p>}
                                    </PopoverContent>
                                </Popover>
                                <Button variant="outline" size="icon" onClick={() => setIsCreatingCustomer(true)}><UserPlus className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {selectedCustomer && (
                            <div className="p-2 bg-green-50 text-green-800 border-l-4 border-green-500 rounded-r-md text-sm">
                                Đã chọn: <span className="font-semibold">{selectedCustomer.fields.fullname}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Chi tiết đơn hàng</Label>
                        {items.map((item, index) => (
                            <div key={item.key} className="border p-4 rounded-lg shadow-sm bg-gray-50 space-y-4 relative">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="flex items-center text-sm font-medium"><Package className="mr-2 h-4 w-4" />Tên hàng hóa</Label>
                                         <Popover open={item.is_product_search_open} onOpenChange={(isOpen) => handleItemChange(index, 'is_product_search_open', isOpen)}>
                                            <PopoverTrigger asChild>
                                                <div className="relative">
                                                    <Input 
                                                        value={item.product_search_term} 
                                                        onChange={e => handleProductSearchChange(index, e.target.value)}
                                                    />
                                                    {item.is_searching_product ? 
                                                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin"/> : 
                                                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    }
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                {item.product_search_results.length > 0 ? (
                                                    item.product_search_results.map(p => (
                                                        <div key={p.id} onClick={() => handleSelectProduct(index, p)} className="p-2 hover:bg-accent cursor-pointer text-sm">
                                                            {p.fields.product_name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="p-2 text-sm text-center text-muted-foreground">Không tìm thấy sản phẩm</p>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="flex items-center text-sm font-medium"><ChevronDown className="mr-2 h-4 w-4" />Đơn vị tính</Label>
                                        <Select
                                            value={item.unit_conversion_id ?? ''}
                                            onValueChange={(unitId) => {
                                                const selectedUnit = items[index].available_units.find(u => u.id === unitId);
                                                handleItemChanges(index, {
                                                    unit_conversion_id: unitId,
                                                    unit_price: selectedUnit ? selectedUnit.fields.price : null,
                                                    vat: selectedUnit ? selectedUnit.fields.vat : null,
                                                });
                                            }}
                                            disabled={!item.product_id || item.available_units.length === 0}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Chọn ĐVT..." /></SelectTrigger>
                                            <SelectContent>
                                                {item.available_units.map(unit => (
                                                    <SelectItem key={unit.id} value={unit.id}>{unit.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                    <Button onClick={handleSubmit} disabled={isSavingOrder}>
                        {isSavingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Xác nhận & Lưu
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

    
