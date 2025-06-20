
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader'; 

export const metadata: Metadata = {
  title: 'VocalNote - Ghi Âm và Chuyển Đổi Giọng Nói',
  description: 'Một ứng dụng PWA để ghi âm từ micro của bạn và chuyển đổi thành văn bản.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#00BFFF" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <PwaLoader />
      </body>
    </html>
  );
}

