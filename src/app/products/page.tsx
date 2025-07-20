// src/app/products/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useFetchProducts, useFetchAllUnitConversionsForProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, Inbox, CheckCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const router = useRouter();
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const { data: products, isLoading: isLoadingProducts, isError: isProductsError } = useFetchProducts();

    const productIds = products?.map(p => p.id) ?? [];
    const { data: allUnits, isLoading: isLoadingUnits } = useFetchAllUnitConversionsForProducts(productIds);

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.push('/auth');
        }
    }, [isAuthenticated, _hasHydrated, router]);

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
        if (isLoadingProducts || (productIds.length > 0 && isLoadingUnits)) {
            return renderSkeleton();
        }

        if (isProductsError) {
            return (
                <div className="text-center py-16 text-red-500">
                    <AlertTriangle className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-xl font-medium">Lỗi tải sản phẩm</h3>
                    <p className="mt-2 text-md">Đã có lỗi xảy ra. Vui lòng thử lại sau.</p>
                </div>
            );
        }

        if (!products || products.length === 0) {
            return (
                <div className="text-center py-16 animate-fade-in-up">
                    <Inbox className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-medium">Chưa có sản phẩm nào</h3>
                    <p className="mt-2 text-md text-muted-foreground">
                        Bạn có thể tạo sản phẩm mới từ màn hình ghi âm.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {products.map((product) => {
                    const productUnits = allUnits?.filter(u => u.fields.San_Pham && u.fields.San_Pham[0].id === product.id)
                        .sort((a, b) => (b.fields.conversion_factor || 0) - (a.fields.conversion_factor || 0));
                    
                    const baseUnit = productUnits?.find(u => u.fields.conversion_factor === 1);
                    const inventory = product.fields.inventory ?? 0;

                    return (
                        <Card key={product.id} className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                           <div className="p-4 flex-grow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                         <CardTitle className="flex items-center gap-2 text-primary text-lg">
                                            <Package className="h-5 w-5" />
                                            {product.fields.product_name}
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-1">
                                            Tồn kho cơ sở: <span className="font-semibold text-foreground">{inventory} {baseUnit?.fields.unit_default || ''}</span>
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {productUnits && productUnits.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="item-1" className="border-none">
                                                <AccordionTrigger className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-sm hover:no-underline">
                                                    <span>Xem quy đổi tồn kho</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 space-y-1.5">
                                                    {productUnits.map(unit => {
                                                        const { main, remainder } = calculateInventoryForUnit(inventory, unit.fields.conversion_factor);
                                                        const isBaseUnit = unit.fields.conversion_factor === 1;
                                                        return (
                                                            <div key={unit.id} className={cn(
                                                                "flex justify-between items-center text-sm p-1.5 rounded-md",
                                                                isBaseUnit ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-secondary/60 dark:bg-secondary/30"
                                                            )}>
                                                                <span className="font-medium flex items-center gap-1.5">
                                                                    {isBaseUnit && <CheckCircle className="h-3.5 w-3.5 text-green-600"/>}
                                                                    {unit.fields.name_unit}
                                                                </span>
                                                                <Badge variant={isBaseUnit ? "default" : "secondary"} className={cn("text-sm", isBaseUnit && "bg-green-600 text-white")}>
                                                                    {main}
                                                                    {!isBaseUnit && remainder > 0 && baseUnit && ` (dư ${remainder})`}
                                                                </Badge>
                                                            </div>
                                                        );
                                                    })}
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2">Không có đơn vị quy đổi.</p>
                                    )}
                                </div>
                           </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col text-foreground p-4 sm:p-6 lg:p-8">
            <div className="w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary self-start sm:self-center">
                        Danh sách Hàng hóa
                    </h1>
                </div>
                <main className="flex-grow w-full">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
