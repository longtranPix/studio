
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import PwaLoader from '@/components/pwa-loader'; 
import { QueryProvider } from '@/lib/query-provider';
import { cn } from '@/lib/utils';

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

const Footer = () => (
  <footer className="w-full shrink-0 border-t bg-background py-6 text-center text-sm text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} Nola. Bảo lưu mọi quyền.</p>
  </footer>
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={cn("font-sans antialiased", fontSans.variable)}>
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
