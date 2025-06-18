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
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
            toast({
              title: "Offline Mode Error",
              description: "Could not enable offline capabilities.",
              variant: "destructive",
            });
          });
      });
    }
  }, [toast]);
  return null;
}
