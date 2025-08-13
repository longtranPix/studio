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
    selectedCatalogs: CatalogRecord[];
    submitted: boolean;
    index: number;
}

export function AttributeCard({ item, onChange, onRemove, selectedCatalogs, submitted, index }: AttributeCardProps) {
    const { toast } = useToast();

    console.log('Check data: ', item)

    // Hooks for data fetching
    const { refetch: refetchTypes, data: typeData } = useSearchAttributeTypes(item.typeSearchTerm, selectedCatalogs.length > 0 ? selectedCatalogs.map(c => c.id) : null);
    const { refetch: refetchValues, data: valueData } = useSearchAttributes({ query: item.valueSearchTerm, typeId: item.typeId });

    // Hooks for creating new items
    const { mutateAsync: createType } = useCreateAttributeType();
    const { mutateAsync: createValue } = useCreateAttribute();

    // Selection handlers
    const selectAttributeType = (type: any) => {
        onChange(index, 'typeId', type.id);
        onChange(index, 'typeName', type.fields.name);
        onChange(index, 'typeSearchTerm', type.fields.name);
        // Reset value when type changes
        onChange(index, 'valueId', null);
        // onChange(index, 'valueSearchTerm', '');
    };

    const selectAttributeValue = (value: any) => {
        onChange(index, 'valueId', value.id);
        onChange(index, 'valueSearchTerm', value.fields.value_attribute);
    };

    // Create handlers with auto-selection
    const createAttributeType = async (name: string) => {
        if (selectedCatalogs.length === 0) return null;
        try {
            const newType = await createType({ name, catalogs: selectedCatalogs.map(c => c.id) });
            if (newType?.records?.length > 0) {
                const newRecord = newType.records[0];
                // Return new record; Combobox will call onValueChange to select it
                refetchTypes();
                return newRecord;
            }
        } catch (error) {
            console.error('Failed to create attribute type:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tạo loại thuộc tính mới.',
                variant: 'destructive'
            });
        }
        return null;
    };

    const createAttributeValue = async (name: string) => {
        if (!item.typeId) {
            toast({ title: 'Lỗi', description: 'Vui lòng chọn loại thuộc tính trước.', variant: 'destructive' });
            return null;
        }
        try {
            const newRecord = await createValue({ value_attribute: name, attribute_type: { id: item.typeId } });
            if (newRecord?.records?.length > 0) {
                const createdRecord = newRecord.records[0];
                refetchValues();
                // selectAttributeValue(createdRecord);
                // Return new record; Combobox will call onValueChange to select it
                return createdRecord;
            }
        } catch (error) {
            console.error('Failed to create attribute value:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tạo giá trị thuộc tính mới.',
                variant: 'destructive'
            });
        }
        return null;
    };

    // Reset and auto-fetch types when catalogs change
    useEffect(() => {
        if (selectedCatalogs.length > 0) {
            // Reset type selection when catalogs change
            if (item.typeId) {
                onChange(index, 'typeId', null);
                onChange(index, 'typeName', '');
                onChange(index, 'typeSearchTerm', '');
                onChange(index, 'valueId', null);
                onChange(index, 'valueSearchTerm', '');
            }

            const fetchAndAutoSelect = async () => {
                const { data } = await refetchTypes();
                // Auto-select if only one result and no type is selected
                if (data && data.length === 1) {
                    selectAttributeType(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [selectedCatalogs.length]);

    // Refetch types on typing and auto-select if one result
    useEffect(() => {
        if (selectedCatalogs.length > 0 && item.typeSearchTerm) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchTypes();
                if (data && data.length === 1 && !item.typeId) {
                    selectAttributeType(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [item.typeSearchTerm, selectedCatalogs.length]);

    // Auto-fetch values when type changes (only on type change)
    useEffect(() => {
        if (item.typeId && !item.valueId) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchValues();
                // Auto-select if only one result and no value is selected
                if (data && data.length === 1) {
                    selectAttributeValue(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [item.typeId]);

    // Refetch values on typing (no auto-select)
    useEffect(() => {
        if (item.typeId && item.valueSearchTerm) {
            refetchValues();
        }
    }, [item.valueSearchTerm]);

    console.log('check attribute: ', valueData, typeData)
    
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
                            onValueChange={(_, __, record) => selectAttributeType(record)}
                            onSearchChange={(term) => onChange(index, 'typeSearchTerm', term)}
                            initialSearchTerm={item.typeSearchTerm}
                            placeholder="Tìm hoặc tạo loại..."
                            data={typeData || []}
                            createFn={createAttributeType}
                            isInvalid={submitted && !!item.typeSearchTerm && !item.typeId}
                            disabled={selectedCatalogs.length === 0}
                            valueFormatter={(record) => record.fields.name}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm">Giá trị thuộc tính</Label>
                        <Combobox
                            value={item.valueId || ''}
                            onValueChange={(_, __, record) => selectAttributeValue(record)}
                            onSearchChange={(term) => onChange(index, 'valueSearchTerm', term)}
                            initialSearchTerm={item.valueSearchTerm}
                            placeholder={!item.typeId ? "Chọn loại thuộc tính trước..." : "Chọn hoặc tạo giá trị..."}
                            data={valueData || []}
                            createFn={createAttributeValue}
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
