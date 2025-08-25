// src/components/home/catalog-multi-select.tsx
'use client';

import type { CatalogRecord } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/shared/combobox';
import { useSearchCatalogs, useCreateCatalog } from '@/hooks/use-attributes';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogMultiSelectProps {
    selectedCatalogs: CatalogRecord[];
    catalogSearchTerm: string;
    onChangeCatalogs: (catalogs: CatalogRecord[]) => void;
    onSearchTermChange: (term: string) => void;
    submitted: boolean;
    disabled?: boolean;
    initialData?: { catalog?: string } | null;
}

export function CatalogMultiSelect({
    selectedCatalogs,
    catalogSearchTerm,
    onChangeCatalogs,
    onSearchTermChange,
    submitted,
    disabled = false,
    initialData
}: CatalogMultiSelectProps) {
    const { toast } = useToast();
    const { refetch: refetchCatalogs, data: catalogDataRaw } = useSearchCatalogs(catalogSearchTerm);
    const { mutateAsync: createCatalog } = useCreateCatalog();

    const catalogData = (catalogDataRaw || []).filter(c => !selectedCatalogs.find(sc => sc.id === c.id));

    const addCatalog = useCallback((catalog: CatalogRecord) => {
        if (selectedCatalogs.some(c => c.id === catalog.id)) return;
        onChangeCatalogs([...selectedCatalogs, catalog]);
        onSearchTermChange('');
    }, [selectedCatalogs, onChangeCatalogs, onSearchTermChange]);

    const removeCatalog = useCallback((catalogId: string) => {
        onChangeCatalogs(selectedCatalogs.filter(c => c.id !== catalogId));
    }, [selectedCatalogs, onChangeCatalogs]);

    // Restore auto-selection logic
    useEffect(() => {
        if (catalogSearchTerm) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchCatalogs();
                if (data && data.length === 1 && !selectedCatalogs.find(c => c.id === data[0].id)) {
                    addCatalog(data[0]);
                }
            };
            const t = setTimeout(fetchAndAutoSelect, 300);
            return () => clearTimeout(t);
        }
    }, [catalogSearchTerm, selectedCatalogs, addCatalog, refetchCatalogs]);

    const isInvalid = submitted && selectedCatalogs.length === 0;

    return (
        <div className="space-y-2">
            <div className={cn(
                "w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 text-sm ring-offset-background",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                isInvalid && "border-destructive",
                !isInvalid && selectedCatalogs.length > 0 && "border-green-500" // Green outline for valid state
            )}>
                {selectedCatalogs.map(cat => (
                    <div key={cat.id} className="mb-1 inline-flex items-center gap-2 bg-primary/10 text-primary rounded-md pl-3 pr-1.5 py-1 text-sm font-medium">
                        <span>{cat.fields.name}</span>
                        <button
                            type="button"
                            className="text-primary hover:bg-primary/20 rounded-full p-0.5"
                            onClick={() => removeCatalog(cat.id)}
                            aria-label={`Remove ${cat.fields.name}`}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <Combobox
                    value={''}
                    onValueChange={(_, __, record) => {
                        addCatalog(record);
                        onSearchTermChange('');
                    }}
                    onSearchChange={onSearchTermChange}
                    initialSearchTerm={catalogSearchTerm}
                    placeholder="Tìm hoặc tạo catalog..."
                    data={catalogData || []}
                    onCreateNew={async (name) => {
                        try {
                            const newCatalog = await createCatalog({ name });
                            if (newCatalog && newCatalog.records.length > 0) {
                                const createdCatalog = newCatalog.records[0];
                                addCatalog(createdCatalog);
                                await refetchCatalogs();
                            }
                        } catch (error) {
                            console.error('Failed to create catalog:', error);
                            toast({
                                title: 'Lỗi',
                                description: 'Không thể tạo catalog mới.',
                                variant: 'destructive'
                            });
                        }
                    }}
                    showCreateOption={true}
                    disabled={disabled}
                    valueFormatter={(record) => record.fields.name}
                    isEmbedded={true}
                />
            </div>
        </div>
    );
}
