// src/components/shared/product-search-input.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Check } from 'lucide-react';
import { useSearchProducts } from '@/hooks/use-products';
import type { ProductRecord } from '@/types/order';
import { cn } from '@/lib/utils';


interface ProductSearchInputProps {
    initialSearchTerm: string;
    value: string;
    onSearchTermChange: (term: string) => void;
    onProductSelect: (product: ProductRecord) => void;
    selectedProductId: string | null;
    isInvalid?: boolean;
}

export function ProductSearchInput({
    initialSearchTerm,
    value,
    onSearchTermChange,
    onProductSelect,
    selectedProductId,
    isInvalid,
}: ProductSearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasAutoSelected = useRef(false);

    const { data: results, refetch, isLoading } = useSearchProducts(value);

    const debouncedSearch = useDebouncedCallback(() => {
        refetch();
    }, 300);

    // Initial search based on voice input
    useEffect(() => {
        const performInitialSearch = async () => {
            if (initialSearchTerm && !hasAutoSelected.current) {
                onSearchTermChange(initialSearchTerm);
                hasAutoSelected.current = true;
                const { data } = await refetch();
                if (data && data.length === 1) {
                    onProductSelect(data[0]);
                } else if (data && data.length > 1) {
                    setIsOpen(true); // Open dropdown if multiple results found on initial load
                }
            }
        };
        performInitialSearch();
    }, [initialSearchTerm, onProductSelect, refetch, onSearchTermChange]);
    

    const handleSelect = (product: ProductRecord) => {
        onProductSelect(product);
        setIsOpen(false);
    };

    useEffect(() => {
        if(results && document.activeElement === inputRef.current) {
             setIsOpen(results.length > 0);
        }
    }, [results])

    const inputRef = useRef<HTMLInputElement>(null);
    const isValid = !!selectedProductId;

    return (
        <div className="relative">
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => {
                        onSearchTermChange(e.target.value);
                        debouncedSearch();
                    }}
                    onFocus={() => { if (results && results.length > 0) setIsOpen(true) }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                    placeholder="Tìm sản phẩm..."
                    className={cn(
                        "pr-10",
                        isInvalid && "border-destructive",
                        isValid && !isInvalid && "border-green-500"
                    )}
                />
                {isLoading ? (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                ) : isValid ? (
                     <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                ) : (
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {results && results.length > 0 ? (
                        results.map(p => (
                            <div
                                key={p.id}
                                onMouseDown={() => handleSelect(p)}
                                className="p-2 hover:bg-accent cursor-pointer text-sm flex items-center justify-between"
                            >
                                <span>{p.fields.product_name}</span>
                                {selectedProductId === p.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                        ))
                    ) : (
                        !isLoading && <div className="p-2 text-sm text-center text-muted-foreground">Không tìm thấy sản phẩm</div>
                    )}
                </div>
            )}
        </div>
    );
}
