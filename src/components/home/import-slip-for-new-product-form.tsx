// src/components/home/import-slip-for-new-product-form.tsx
'use client';

import { useState, useEffect } from 'react';
import type { ProductRecord, UnitConversionRecord, SupplierRecord, CreateImportSlipPayload } from '@/types/order';
import { useCreateImportSlip } from '@/hooks/use-orders';
import { useSearchSuppliers, useCreateSupplier } from '@/hooks/use-suppliers';

import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/shared/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImportSlipForNewProductFormProps {
    product: ProductRecord & { unit_conversions: UnitConversionRecord[] };
    onCancel: () => void;
}

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined' || isNaN(value)) return '0 VND';
    return `${value.toLocaleString('de-DE')} VND`;
};

export function ImportSlipForNewProductForm({ product, onCancel }: ImportSlipForNewProductFormProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierData, setSupplierData] = useState<any[]>([]);
    const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
    const [importUnitId, setImportUnitId] = useState<string>('');
    const [importQuantity, setImportQuantity] = useState<number | string>(1);
    const [importPrice, setImportPrice] = useState<number | string>('');
    const [importVat, setImportVat] = useState<number | string>(0);
    const router = useRouter();

    const { toast } = useToast();

    const { mutateAsync: createSupplier } = useCreateSupplier();
    const { mutate: createImportSlip, isPending: isSavingImportSlip } = useCreateImportSlip({
        onSuccess: () => {
            router.push('/');
            onCancel(); // Reset the main screen state
        }
    });
    const { refetch: searchSuppliers } = useSearchSuppliers(supplierSearchTerm);

    useEffect(() => {
        if (product.unit_conversions.length === 1) {
            setImportUnitId(product.unit_conversions[0].id);
        }
    }, [product]);

    const handleSupplierSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSupplierData([]);
            return;
        }
        
        setIsSearchingSuppliers(true);
        try {
            const result = await searchSuppliers();
            if (result.data) {
                setSupplierData(result.data);
            }
        } catch (error) {
            console.error('Error searching suppliers:', error);
            setSupplierData([]);
        } finally {
            setIsSearchingSuppliers(false);
        }
    };

    const handleCreateNewSupplier = async (name: string): Promise<void> => {
        try {
            const newSupplier = await createSupplier({ supplier_name: name, address: '' });
            if (newSupplier && newSupplier.records && newSupplier.records.length > 0) {
                setSelectedSupplier(newSupplier.records[0]);
                // Refresh supplier search after creating new one
                handleSupplierSearch(supplierSearchTerm);
            }
        } catch (error) {
            console.error('Error creating supplier:', error);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (supplierSearchTerm) {
                handleSupplierSearch(supplierSearchTerm);
            } else {
                setSupplierData([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [supplierSearchTerm]);

    const handleImportSlipSubmit = async() => {
        if (!selectedSupplier || (product?.unit_conversions.length > 1 ? !importUnitId : false) || !importQuantity || !importPrice) {
            toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn nhà cung cấp, nhập số lượng và giá nhập.', variant: 'destructive' });
            return;
        }

        const payload: CreateImportSlipPayload = {
            supplier_id: selectedSupplier.id || "",
            import_type: 'Nhập mua',
            import_slip_details: [
                {
                    product_id: product.id,
                    unit_conversions_id: importUnitId || (product.unit_conversions.length === 1 ? product.unit_conversions[0].id : ""),
                    quantity: Number(importQuantity),
                    unit_price: Number(importPrice),
                    vat: Number(importVat),
                }
            ],
        };
        createImportSlip(payload);
    };

    return (
        <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 space-y-4 animate-fade-in-up">
            
            <div className="flex items-center">
                <Label className="w-[40%]">Nhà cung cấp</Label>
                <div className="w-[60%]">
                    <Combobox
                        value={selectedSupplier?.id || ''}
                        onValueChange={(_, __, record) => setSelectedSupplier(record || null)}
                        onSearchChange={setSupplierSearchTerm}
                        initialSearchTerm={supplierSearchTerm}
                        placeholder="Tìm hoặc tạo nhà cung cấp..."
                        data={supplierData}
                        isLoading={isSearchingSuppliers}
                        onCreateNew={handleCreateNewSupplier}
                        showCreateOption={true}
                        valueFormatter={(record) => record.fields.supplier_name}
                    />
                </div>
            </div>

            {product.unit_conversions.length > 1 && (
                <div className="flex items-center">
                    <Label htmlFor="import-unit" className="w-[40%]">Đơn vị Nhập</Label>
                    <div className="w-[60%]">
                        <Select value={importUnitId} onValueChange={setImportUnitId}>
                            <SelectTrigger id="import-unit"><SelectValue placeholder="Chọn đơn vị..." /></SelectTrigger>
                            <SelectContent>
                                {product.unit_conversions.map(unit => (
                                    <SelectItem key={unit.id} value={unit.id}>{unit.fields.name_unit}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
             <div className="flex items-center">
                <Label htmlFor="import-quantity" className="w-[40%]">Số lượng</Label>
                <div className="w-[60%]">
                    <Input id="import-quantity" type="number" value={importQuantity} onChange={e => setImportQuantity(e.target.value)} placeholder="0" />
                </div>
            </div>
            <div className="flex items-center">
                <Label htmlFor="import-price" className="w-[40%]">Giá nhập / đơn vị</Label>
                <div className="w-[60%]">
                    <Input id="import-price" type="number" value={importPrice} onChange={e => setImportPrice(e.target.value)} placeholder="0" />
                    {Number(importPrice) > 0 && <p className="text-xs text-muted-foreground text-right pt-1">{formatCurrency(Number(importPrice))}</p>}
                </div>
            </div>
             <div className="flex items-center">
                <Label htmlFor="import-vat" className="w-[40%]">Thuế GTGT (%)</Label>
                <div className="w-[60%]">
                    <Input id="import-vat" type="number" value={importVat} onChange={e => setImportVat(e.target.value)} placeholder="0" />
                </div>
            </div>

             <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={isSavingImportSlip}>
                    <X className="mr-2 h-4 w-4" /> Bỏ qua
                </Button>
                <Button onClick={handleImportSlipSubmit} disabled={isSavingImportSlip || !selectedSupplier || (product?.unit_conversions.length > 1 ? !importUnitId : false) || !importPrice || !importQuantity}>
                    {isSavingImportSlip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu & Nhập kho
                </Button>
            </div>
        </div>
    );
}
