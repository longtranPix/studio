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

interface AttributeCardProps {
    item: EditableAttributeItem;
    onChange: <K extends keyof EditableAttributeItem>(field: K, value: EditableAttributeItem[K]) => void;
    onRemove: () => void;
    selectedCatalog: CatalogRecord | null;
    submitted: boolean;
}

export function AttributeCard({ item, onChange, onRemove, selectedCatalog, submitted }: AttributeCardProps) {
    const { toast } = useToast();
    const { mutateAsync: searchTypes } = useSearchAttributeTypes();
    const { mutateAsync: createType } = useCreateAttributeType();
    const { mutateAsync: searchValues } = useSearchAttributes();
    const { mutateAsync: createValue } = useCreateAttribute();
    
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
                                onChange('typeId', id);
                                onChange('typeName', label || '');
                                // Reset value when type changes
                                onChange('valueId', null);
                                onChange('valueSearchTerm', '');
                            }}
                            onSearchChange={(term) => onChange('typeSearchTerm', term)}
                            initialSearchTerm={item.typeSearchTerm}
                            placeholder="Tìm hoặc tạo loại..."
                            searchFn={(term) => searchTypes({ query: term, catalogId: selectedCatalog?.id || null })}
                            createFn={async (name) => {
                                if (!selectedCatalog) return null;
                                const newType = await createType({ name, catalog: { id: selectedCatalog.id } });
                                if (newType && newType.records.length > 0) {
                                    const newRecord = newType.records[0];
                                    onChange('typeId', newRecord.id);
                                    onChange('typeName', newRecord.fields.name);
                                    return newRecord;
                                }
                                return null;
                            }}
                            isInvalid={submitted && !!item.typeSearchTerm && !item.typeId}
                            disabled={!selectedCatalog}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm">Giá trị thuộc tính</Label>
                        <Combobox
                            value={item.valueId || ''}
                            onValueChange={(id) => onChange('valueId', id)}
                            onSearchChange={(term) => onChange('valueSearchTerm', term)}
                            initialSearchTerm={item.valueSearchTerm}
                            placeholder="Chọn hoặc tạo giá trị..."
                            searchFn={(term) => searchValues({ query: term, typeId: item.typeId })}
                            createFn={async (name) => {
                                if (!item.typeId) {
                                    toast({ title: 'Lỗi', description: 'Vui lòng chọn loại thuộc tính trước.', variant: 'destructive' });
                                    return null;
                                };
                                return createValue({ value_attribute: name, attribute_type: { id: item.typeId } });
                            }}
                            disabled={!item.typeId}
                            isInvalid={submitted && !!item.valueSearchTerm && !item.valueId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
