
// src/components/pwa-loader.tsx
'use client';
import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export default function PwaLoader() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker đã đăng ký với scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Đăng ký Service Worker thất bại:', error);
            toast({
              title: "Lỗi Chế Độ Ngoại Tuyến",
              description: "Không thể kích hoạt tính năng ngoại tuyến.",
              variant: "destructive",
            });
          });
      });
    }
  }, [toast]);
  return null;
}

