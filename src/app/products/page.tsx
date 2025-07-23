// src/app/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { useAuthStore } from '@/store/auth-store';
import { useFetchProducts, useFetchTotalProducts, useFetchAllUnitConversionsForProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, Inbox, CheckCircle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
    const router = useRouter();
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const { 
        data: productsData, 
        isLoading: isLoadingPageProducts, 
        isFetching: isFetchingProducts,
        isError: isProductsError 
    } = useFetchProducts(currentPage, debouncedSearchTerm);
    
    const { data: totalRecords, isLoading: isLoadingTotal } = useFetchTotalProducts(debouncedSearchTerm);

    const isLoading = (isLoadingPageProducts || isLoadingTotal) && !productsData;
    const products = productsData ?? [];
    const totalPages = totalRecords ? Math.ceil(totalRecords / 10) : 1;

    const productIds = products?.map(p => p.id) ?? [];
    const { data: allUnits, isLoading: isLoadingUnits } = useFetchAllUnitConversionsForProducts(productIds);

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.push('/auth');
        }
    }, [isAuthenticated, _hasHydrated, router]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);


    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const calculateInventoryForUnit = (baseInventory: number, conversionFactor: number) => {
        if (!baseInventory || !conversionFactor) return { main: 0, remainder: 0 };
        if (conversionFactor === 0) return { main: Infinity, remainder: 0 };
        const main = Math.floor(baseInventory / conversionFactor);
        const remainder = baseInventory % conversionFactor;
        return { main, remainder };
    };

    const renderSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-1/2 mt-2 rounded-md" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-5 w-28 mb-4 rounded-md" />
                        <div className="space-y-3">
                           <Skeleton className="h-8 w-full rounded-md" />
                           <Skeleton className="h-8 w-full rounded-md" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderContent = () => {
        if (isLoading || (productIds.length > 0 && isLoadingUnits)) {
            return renderSkeleton();
        }

        if (isProductsError) {
            return (
                <div className="text-center py-16 text-red-500">
                    <AlertTriangle className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg sm:text-xl font-medium">Lỗi tải sản phẩm</h3>
                    <p className="mt-2 text-sm sm:text-base">Đã có lỗi xảy ra. Vui lòng thử lại sau.</p>
                </div>
            );
        }

        if (!products || products.length === 0) {
            return (
                <div className="text-center py-16 animate-fade-in-up">
                    <Inbox className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl sm:text-2xl font-medium">Chưa có sản phẩm nào</h3>
                    <p className="mt-2 text-base text-muted-foreground">
                        Không tìm thấy sản phẩm nào phù hợp. Bạn có thể tạo sản phẩm mới từ màn hình ghi âm.
                    </p>
                </div>
            );
        }

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {products.map((product) => {
                        const productUnits = allUnits?.filter(u => u.fields.San_Pham && u.fields.San_Pham[0].id === product.id)
                            // Sort from smallest conversion factor to largest
                            .sort((a, b) => (a.fields.conversion_factor || 0) - (b.fields.conversion_factor || 0));
                        
                        const baseUnit = productUnits?.find(u => u.fields.conversion_factor === 1);
                        const otherUnits = productUnits?.filter(u => u.fields.conversion_factor !== 1) || [];
                        const inventory = product.fields.inventory ?? 0;

                        return (
                            <Card key={product.id} className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                            <div className="p-4 flex-grow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2 text-primary text-xl">
                                                <Package className="h-5 w-5" />
                                                {product.fields.product_name}
                                            </CardTitle>
                                            <CardDescription className="text-base mt-1 font-semibold text-green-700 dark:text-green-300">
                                                Tồn kho cơ sở: <span className="font-bold text-green-600 dark:text-green-200">{inventory} {baseUnit?.fields.unit_default || ''}</span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        {otherUnits.length > 0 ? (
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="item-1" className="border-none">
                                                    <AccordionTrigger className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-sm hover:no-underline">
                                                        <span>Xem quy đổi tồn kho</span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-2 space-y-1.5">
                                                        {otherUnits.map(unit => {
                                                            const { main, remainder } = calculateInventoryForUnit(inventory, unit.fields.conversion_factor);
                                                            return (
                                                                <div key={unit.id} className="flex justify-between items-center text-base p-1.5 rounded-md bg-secondary/60 dark:bg-secondary/30">
                                                                    <span className="font-medium flex items-center gap-1.5">
                                                                        {unit.fields.name_unit}
                                                                    </span>
                                                                    <Badge variant="secondary" className="text-base">
                                                                        {main}
                                                                        {remainder > 0 && baseUnit && ` (dư ${remainder})`}
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        })}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ) : (
                                            productUnits && productUnits.length > 0 &&
                                            <p className="text-sm text-muted-foreground mt-2 italic">Chỉ có 1 đơn vị tính.</p>
                                        )}
                                    </div>
                            </div>
                            </Card>
                        );
                    })}
                </div>
                 {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isFetchingProducts}
                            variant="outline"
                        >
                            {isFetchingProducts && currentPage === currentPage-1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ChevronLeft className="mr-2 h-4 w-4" />}
                            Trước
                        </Button>
                        <span className="text-sm font-medium">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || isFetchingProducts}
                            variant="outline"
                        >
                            Sau
                            {isFetchingProducts && currentPage === currentPage+1 ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <ChevronRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="flex flex-1 flex-col text-foreground p-4 sm:p-6 lg:p-8">
            <div className="w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary self-start sm:self-center">
                        Danh sách Hàng hóa
                    </h1>
                     <div className="relative w-full sm:w-72">
                        <Input
                            placeholder="Tìm kiếm tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10 h-10 text-base"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <main className="flex-grow w-full">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
