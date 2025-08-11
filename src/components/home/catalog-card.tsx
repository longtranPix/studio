// src/components/home/catalog-card.tsx
'use client';

import type { CatalogRecord } from '@/types/order';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/shared/combobox';
import { useSearchCatalogs, useCreateCatalog } from '@/hooks/use-attributes';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';

interface CatalogCardProps {
    selectedCatalog: CatalogRecord | null;
    catalogSearchTerm: string;
    onSelectCatalog: (catalog: CatalogRecord) => void;
    onSearchTermChange: (term: string) => void;
    submitted: boolean;
    disabled?: boolean;
    initialData?: { catalog?: string } | null;
}

export function CatalogCard({ 
    selectedCatalog, 
    catalogSearchTerm, 
    onSelectCatalog, 
    onSearchTermChange, 
    submitted, 
    disabled = false,
    initialData 
}: CatalogCardProps) {
    const { toast } = useToast();
    const { refetch: refetchCatalogs, data: catalogData } = useSearchCatalogs(catalogSearchTerm);
    const { mutateAsync: createCatalog } = useCreateCatalog();

    const handleSelectCatalog = useCallback((catalog: CatalogRecord) => {
        onSelectCatalog(catalog);
        onSearchTermChange(catalog.fields.name);
    }, [onSelectCatalog, onSearchTermChange]);

    // Auto-fetch catalogs on initial load with transcription data only
    useEffect(() => {
        if (catalogSearchTerm && !selectedCatalog && initialData?.catalog) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchCatalogs();
                // Auto-select if only one result and no catalog is selected
                if (data && data.length === 1) {
                    handleSelectCatalog(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [initialData?.catalog]);

    // Refetch on typing (no auto-select)
    useEffect(() => {
        if (catalogSearchTerm) {
            const t = setTimeout(() => { refetchCatalogs(); }, 300);
            return () => clearTimeout(t);
        }
    }, [catalogSearchTerm]);

    return (
        <div className="space-y-2">
            <Label className="font-semibold text-base">Catalog</Label>
            <Combobox 
                value={selectedCatalog?.id || ''} 
                onValueChange={(_, __, record) => handleSelectCatalog(record)} 
                onSearchChange={onSearchTermChange} 
                initialSearchTerm={catalogSearchTerm} 
                placeholder="Tìm hoặc tạo catalog..." 
                data={catalogData || []}
                createFn={async (name) => {
                    try {
                        const newCatalog = await createCatalog({ name });
                        if (newCatalog && newCatalog.records.length > 0) {
                            const createdCatalog = newCatalog.records[0];
                            // Auto-select the newly created catalog
                            onSelectCatalog(createdCatalog);
                            onSearchTermChange(createdCatalog.fields.name);
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
                isInvalid={submitted && !selectedCatalog} 
                disabled={disabled}
                valueFormatter={(record) => record.fields.name}
            />
        </div>
    );
}
