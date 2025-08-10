// src/components/home/attribute-card.tsx
'use client';

import type { CatalogRecord, EditableAttributeItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/shared/combobox';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useSearchAttributeTypes, useCreateAttributeType, useSearchAttributes, useCreateAttribute } from '@/hooks/use-attributes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useCallback } from 'react';

interface AttributeCardProps {
    item: EditableAttributeItem;
    onChange: <K extends keyof EditableAttributeItem>(index: number, field: K, value: EditableAttributeItem[K]) => void;
    onRemove: () => void;
    selectedCatalog: CatalogRecord | null;
    submitted: boolean;
    index: number;
}

export function AttributeCard({ item, onChange, onRemove, selectedCatalog, submitted, index }: AttributeCardProps) {
    const { toast } = useToast();
    const { refetch: refetchTypes, data: typeData } = useSearchAttributeTypes(item.typeSearchTerm, selectedCatalog?.id);
    const { refetch: refetchValues, data: valueData } = useSearchAttributes({ query: item.valueSearchTerm, typeId: item.typeId });
    const { mutateAsync: createType } = useCreateAttributeType();
    const { mutateAsync: createValue } = useCreateAttribute();

    const handleSelectType = useCallback((type: any) => {
        onChange(index, 'typeId', type.id);
        onChange(index, 'typeName', type.fields.name);
        // Reset value when type changes
        onChange(index, 'valueId', null);
        onChange(index, 'valueSearchTerm', '');
    }, [index, onChange]);

    const handleSelectValue = useCallback((value: any) => {
        onChange(index, 'valueId', value.id);
        onChange(index, 'valueSearchTerm', value.fields.value_attribute);
    }, [index, onChange]);


    // Auto-fetch types when catalog changes or initial term is set
    useEffect(() => {
        if (selectedCatalog?.id && item.typeSearchTerm && !item.typeId) {
            const search = async () => {
                const { data } = await refetchTypes();
                 if (data && data.length === 1) {
                    handleSelectType(data[0]);
                }
            }
            search();
        }
    }, [selectedCatalog?.id, item.typeSearchTerm, item.typeId, refetchTypes, handleSelectType]);

    // Auto-fetch values when type changes or initial value term is set
    useEffect(() => {
        if (item.typeId && item.valueSearchTerm && !item.valueId) {
            const search = async () => {
                const { data } = await refetchValues();
                if (data && data.length === 1) {
                    handleSelectValue(data[0]);
                }
            }
            search();
        }
    }, [item.typeId, item.valueSearchTerm, item.valueId, refetchValues, handleSelectValue]);
    
    return (
        <div className="relative mt-4">
            <div className={cn("border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800/50 space-y-4 transition-colors", submitted && ((!!item.typeSearchTerm && !item.typeId) || (!!item.valueSearchTerm && !item.valueId)) && "border-destructive bg-destructive/5")}>
                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 z-10 text-destructive bg-background hover:bg-destructive/10 rounded-full h-7 w-7" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-sm">Loại thuộc tính</Label>
                        <Combobox
                            value={item.typeId || ''}
                            onValueChange={(id, label, record) => {
                                handleSelectType(record);
                            }}
                            onSearchChange={(term) => onChange(index, 'typeSearchTerm', term)}
                            initialSearchTerm={item.typeSearchTerm}
                            placeholder="Tìm hoặc tạo loại..."
                            searchHook={() => useSearchAttributeTypes(item.typeSearchTerm, selectedCatalog?.id)}
                            createFn={async (name) => {
                                if (!selectedCatalog) return null;
                                const newType = await createType({ name, catalog: { id: selectedCatalog.id } });
                                if (newType && newType.records.length > 0) {
                                    const newRecord = newType.records[0];
                                    handleSelectType(newRecord);
                                    return newRecord;
                                }
                                return null;
                            }}
                            isInvalid={submitted && !!item.typeSearchTerm && !item.typeId}
                            disabled={!selectedCatalog}
                            valueFormatter={(record) => record.fields.name}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm">Giá trị thuộc tính</Label>
                        <Combobox
                            value={item.valueId || ''}
                            onValueChange={(id, label, record) => handleSelectValue(record)}
                            onSearchChange={(term) => onChange(index, 'valueSearchTerm', term)}
                            initialSearchTerm={item.valueSearchTerm}
                            placeholder="Chọn hoặc tạo giá trị..."
                            searchHook={() => useSearchAttributes({ query: item.valueSearchTerm, typeId: item.typeId })}
                            createFn={async (name) => {
                                if (!item.typeId) {
                                    toast({ title: 'Lỗi', description: 'Vui lòng chọn loại thuộc tính trước.', variant: 'destructive' });
                                    return null;
                                };
                                const newRecord = await createValue({ value_attribute: name, attribute_type: { id: item.typeId } });
                                if (newRecord && newRecord.records.length > 0) {
                                    handleSelectValue(newRecord.records[0]);
                                    return newRecord.records[0];
                                }
                                return null;
                            }}
                            disabled={!item.typeId}
                            isInvalid={submitted && !!item.valueSearchTerm && !item.valueId}
                            valueFormatter={(record) => record.fields.value_attribute}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
