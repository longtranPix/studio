'use client';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createProductWithUnits } from '@/api';
import type { CreateProductPayload } from '@/types/order';

export function useCreateProduct() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductWithUnits(payload),
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Tạo hàng hóa thất bại.';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    },
  });
}
