// src/components/home/import-slip-for-new-product-form.tsx
'use client';

import { useState, useEffect } from 'react';
import type { ProductRecord, UnitConversionRecord, SupplierRecord, CreateImportSlipPayload } from '@/types/order';
import { useCreateImportSlip } from '@/hooks/use-orders';
import { useSearchSuppliers, useCreateSupplier } from '@/hooks/use-suppliers';
import { usePlanStatus } from '@/hooks/use-plan-status';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/shared/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';

interface ImportSlipForNewProductFormProps {
    product: ProductRecord & { unit_conversions: UnitConversionRecord[] };
    onCancel: () => void;
}

export function ImportSlipForNewProductForm({ product, onCancel }: ImportSlipForNewProductFormProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [importUnitId, setImportUnitId] = useState<string>('');
    const [importQuantity, setImportQuantity] = useState<number | string>(1);
    const [importPrice, setImportPrice] = useState<number | string>('');
    const [importVat, setImportVat] = useState<number | string>(0);

    const { toast } = useToast();
    const { refetchPlanStatus } = usePlanStatus();

    const { mutateAsync: createSupplier } = useCreateSupplier();
    const { mutateAsync: searchSuppliers } = useSearchSuppliers();
    const { mutate: createImportSlip, isPending: isSavingImportSlip } = useCreateImportSlip({
        onSuccess: () => {
            toast({ title: 'Thành công', description: 'Đã tạo phiếu nhập kho cho sản phẩm mới.' });
            refetchPlanStatus();
            onCancel();
        }
    });

    useEffect(() => {
        if (product.unit_conversions.length === 1) {
            setImportUnitId(product.unit_conversions[0].id);
        }
    }, [product]);

    const handleImportSlipSubmit = () => {
        if (!selectedSupplier || !importUnitId || !importQuantity || !importPrice) {
            toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn nhà cung cấp, nhập số lượng và giá nhập.', variant: 'destructive' });
            return;
        }

        const payload: CreateImportSlipPayload = {
            supplier_id: selectedSupplier.id,
            import_type: 'Nhập mua',
            import_slip_details: [
                {
                    product_id: product.id,
                    unit_conversions_id: importUnitId,
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.unit_conversions.length > 1 && (
                    <div className="space-y-2">
                        <Label htmlFor="import-unit">Đơn vị Nhập</Label>
                        <Select value={importUnitId} onValueChange={setImportUnitId}>
                            <SelectTrigger id="import-unit"><SelectValue placeholder="Chọn đơn vị..." /></SelectTrigger>
                            <SelectContent>
                                {product.unit_conversions.map(unit => (
                                    <SelectItem key={unit.id} value={unit.id}>{unit.fields.name_unit}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="import-quantity">Số lượng</Label>
                    <Input id="import-quantity" type="number" value={importQuantity} onChange={e => setImportQuantity(e.target.value)} placeholder="0" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                    <Label htmlFor="import-price">Giá nhập / đơn vị</Label>
                    <Input id="import-price" type="number" value={importPrice} onChange={e => setImportPrice(e.target.value)} placeholder="0" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="import-vat">Thuế GTGT (%)</Label>
                    <Input id="import-vat" type="number" value={importVat} onChange={e => setImportVat(e.target.value)} placeholder="0" />
                </div>
            </div>

             <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={isSavingImportSlip}>
                    <X className="mr-2 h-4 w-4" /> Bỏ qua
                </Button>
                <Button onClick={handleImportSlipSubmit} disabled={isSavingImportSlip || !selectedSupplier || !importUnitId || !importQuantity || !importPrice}>
                    {isSavingImportSlip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu & Nhập kho
                </Button>
            </div>
        </div>
    );
}
