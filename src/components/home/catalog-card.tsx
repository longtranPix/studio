// src/components/home/catalog-card.tsx
'use client';

import type { CatalogRecord } from '@/types/order';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/shared/combobox';
import { useSearchCatalogs, useCreateCatalog } from '@/hooks/use-attributes';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';

interface CatalogCardProps {
    selectedCatalogs: CatalogRecord[];
    catalogSearchTerm: string;
    onChangeCatalogs: (catalogs: CatalogRecord[]) => void;
    onSearchTermChange: (term: string) => void;
    submitted: boolean;
    disabled?: boolean;
    initialData?: { catalog?: string } | null;
}

export function CatalogCard({
    selectedCatalogs,
    catalogSearchTerm,
    onChangeCatalogs,
    onSearchTermChange,
    submitted,
    disabled = false,
    initialData
}: CatalogCardProps) {
    const { toast } = useToast();
    const { refetch: refetchCatalogs, data: catalogDataRaw } = useSearchCatalogs(catalogSearchTerm);
    const { mutateAsync: createCatalog } = useCreateCatalog();

    // Filter out already selected catalogs from search results
    const catalogData = (catalogDataRaw || []).filter(c => !selectedCatalogs.find(sc => sc.id === c.id));

    const addCatalog = useCallback((catalog: CatalogRecord) => {
        if (selectedCatalogs.some(c => c.id === catalog.id)) return;
        onChangeCatalogs([...selectedCatalogs, catalog]);
    }, [selectedCatalogs, onChangeCatalogs]);

    const removeCatalog = useCallback((catalogId: string) => {
        onChangeCatalogs(selectedCatalogs.filter(c => c.id !== catalogId));
    }, [selectedCatalogs, onChangeCatalogs]);

    // Auto-fetch catalogs on initial load with transcription data and auto-select if one result
    useEffect(() => {
        if (catalogSearchTerm && initialData?.catalog && selectedCatalogs.length === 0) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchCatalogs();
                if (data && data.length === 1) {
                    addCatalog(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [initialData?.catalog]);

    // Refetch on typing and auto-select if one result
    useEffect(() => {
        if (catalogSearchTerm) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchCatalogs();
                if (data && data.length === 1 && !selectedCatalogs.find(c => c.id === data[0].id)) {
                    addCatalog(data[0]);
                    onSearchTermChange('');
                }
            };
            const t = setTimeout(fetchAndAutoSelect, 300);
            return () => clearTimeout(t);
        }
    }, [catalogSearchTerm, selectedCatalogs]);

    return (
        <div className="space-y-2">
            <Label className="font-semibold text-base">Catalogs</Label>

            {/* Selected catalog chips */}
            {selectedCatalogs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCatalogs.map((cat) => (
                        <div key={cat.id} className="inline-flex items-center gap-2 bg-muted text-foreground rounded-full px-3 py-1 text-sm">
                            <span>{cat.fields.name}</span>
                            <button
                                type="button"
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => removeCatalog(cat.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

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
                createFn={async (name) => {
                    try {
                        const newCatalog = await createCatalog({ name });
                        if (newCatalog && newCatalog.records.length > 0) {
                            const createdCatalog = newCatalog.records[0];
                            addCatalog(createdCatalog);
                            onSearchTermChange('');
                            refetchCatalogs();
                            return createdCatalog;
                        }
                    } catch (error) {
                        console.error('Failed to create catalog:', error);
                        toast({
                            title: 'Lỗi',
                            description: 'Không thể tạo catalog mới.',
                            variant: 'destructive'
                        });
                    }
                    return null;
                }}
                isInvalid={submitted && selectedCatalogs.length === 0}
                disabled={disabled}
                valueFormatter={(record) => record.fields.name}
            />
        </div>
    );
}
