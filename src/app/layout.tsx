
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader'; 
import { QueryProvider } from '@/lib/query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TEIX Voice - Ghi Âm và Chuyển Đổi',
  description: 'Một ứng dụng PWA để ghi âm từ micro của bạn và chuyển đổi thành văn bản.',
  manifest: '/manifest.json',
  themeColor: '#F97316',
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
          <PwaLoader />
        </QueryProvider>
      </body>
    </html>
  );
}
