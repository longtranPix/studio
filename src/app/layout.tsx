
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader'; 
import { QueryProvider } from '@/lib/query-provider';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/app-shell';

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Nola - Nói khẽ, làm nhanh.',
  description: 'Một ứng dụng PWA để ghi âm giọng nói và chuyển đổi thành hóa đơn.',
  manifest: '/manifest.json',
  themeColor: '#5B37E5',
  icons: {
    apple: '/icons/icon.png',
    icon: '/icons/icon.png',
  },
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
          <AppShell>{children}</AppShell>
          <Toaster />
          <PwaLoader />
        </QueryProvider>
      </body>
    </html>
  );
}
