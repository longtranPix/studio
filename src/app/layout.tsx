
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader';
import PlanStatusLoader from '@/components/plan-status-loader';
import { AppShell } from '@/components/layout/app-shell';
import { QueryProvider } from '@/lib/query-provider';
import { cn } from '@/lib/utils';

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Nola: Quản Lý Bằng Giọng Nói - Nhàn Hơn, Chuẩn Hơn!',
  description: 'Một ứng dụng PWA để ghi âm giọng nói và chuyển đổi thành hóa đơn.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/icon.png',
    icon: '/icons/icon.png',
  },
};

export const viewport = {
  themeColor: '#5B37E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={cn("font-sans antialiased", fontSans.variable)}>
        <QueryProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
          <PwaLoader />
          <PlanStatusLoader />
        </QueryProvider>
      </body>
    </html>
  );
}
