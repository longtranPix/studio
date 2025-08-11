// src/components/home/brand-card.tsx
'use client';

import type { BrandRecord } from '@/types/order';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/shared/combobox';
import { useSearchBrands, useCreateBrand } from '@/hooks/use-brands';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';

interface BrandCardProps {
    selectedBrand: BrandRecord | null;
    brandSearchTerm: string;
    onSelectBrand: (brand: BrandRecord) => void;
    onSearchTermChange: (term: string) => void;
    submitted: boolean;
    disabled?: boolean;
    initialData?: { brand_name?: string } | null;
}

export function BrandCard({ 
    selectedBrand, 
    brandSearchTerm, 
    onSelectBrand, 
    onSearchTermChange, 
    submitted, 
    disabled = false,
    initialData 
}: BrandCardProps) {
    const { toast } = useToast();
    const { refetch: refetchBrands, data: brandData } = useSearchBrands(brandSearchTerm);
    const { mutateAsync: createBrand } = useCreateBrand();

    const handleSelectBrand = useCallback((brand: BrandRecord) => {
        onSelectBrand(brand);
        onSearchTermChange(brand.fields.name);
    }, [onSelectBrand, onSearchTermChange]);

    // Auto-fetch brands on initial load with transcription data only
    useEffect(() => {
        if (brandSearchTerm && !selectedBrand && initialData?.brand_name) {
            const fetchAndAutoSelect = async () => {
                const { data } = await refetchBrands();
                // Auto-select if only one result and no brand is selected
                if (data && data.length === 1) {
                    handleSelectBrand(data[0]);
                }
            };
            fetchAndAutoSelect();
        }
    }, [initialData?.brand_name]);

    // Refetch on typing (no auto-select)
    useEffect(() => {
        if (brandSearchTerm) {
            const t = setTimeout(() => { refetchBrands(); }, 300);
            return () => clearTimeout(t);
        }
    }, [brandSearchTerm]);

    return (
        <div className="space-y-2">
            <Label className="font-semibold text-base">Thương hiệu</Label>
            <Combobox 
                value={selectedBrand?.id || ''} 
                onValueChange={(_, __, record) => handleSelectBrand(record)}
                onSearchChange={onSearchTermChange} 
                initialSearchTerm={brandSearchTerm} 
                placeholder="Tìm hoặc tạo thương hiệu..." 
                data={brandData || []}
                createFn={async (name) => {
                    try {
                        const newBrand = await createBrand({ name });
                        if (newBrand && newBrand.records.length > 0) {
                            const createdBrand = newBrand.records[0];
                            // Auto-select the newly created brand
                            onSelectBrand(createdBrand);
                            onSearchTermChange(createdBrand.fields.name);
                            return createdBrand;
                        }
                    } catch (error) {
                        console.error('Failed to create brand:', error);
                        toast({
                            title: 'Lỗi',
                            description: 'Không thể tạo thương hiệu mới.',
                            variant: 'destructive'
                        });
                    }
                    return null;
                }}
                isInvalid={submitted && !selectedBrand} 
                disabled={disabled}
                valueFormatter={(record) => record.fields.name}
            />
        </div>
    );
}
