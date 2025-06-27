
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader'; 
import { QueryProvider } from '@/lib/query-provider';
import { cn } from '@/lib/utils';

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontLogo = Inter({
  subsets: ["latin"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: 'TEIX Voice - Ghi Âm và Chuyển Đổi',
  description: 'Một ứng dụng PWA để ghi âm từ micro của bạn và chuyển đổi thành văn bản.',
  manifest: '/manifest.json',
  themeColor: '#F97316',
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

const Footer = () => (
  <footer className="w-full shrink-0 border-t bg-background py-6 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} TEIX. Bảo lưu mọi quyền.</p>
  </footer>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={cn("font-sans antialiased", fontSans.variable, fontLogo.variable)}>
        <QueryProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <PwaLoader />
        </QueryProvider>
      </body>
    </html>
  );
}
