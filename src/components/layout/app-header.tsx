
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, History, Mic, Package, BookText, Coins } from "lucide-react";
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { creditValue } = useAuthStore();

  const formatCredit = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    return value.toLocaleString('de-DE');
  }

  return (
    <header className="w-full bg-gradient-to-r from-primary to-accent p-4 shadow-md sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
              <Mic className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nola</h1>
            <p className="text-xs font-semibold text-white/80 -mt-0.5">Nói khẽ, làm nhanh.</p>
          </div>
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all text-sm">
            <Link href="/history">
              <History className="mr-2 h-5 w-5" />
              Đơn hàng
            </Link>
          </Button>
           <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all text-sm">
            <Link href="/products">
              <Package className="mr-2 h-5 w-5" />
              Hàng hóa
            </Link>
          </Button>
           <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all text-sm">
            <Link href="/docs">
              <BookText className="mr-2 h-5 w-5" />
              Hướng dẫn
            </Link>
          </Button>

          {creditValue !== null && (
            <Badge variant="outline" className="py-1 px-3 text-base bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-200">
                <Coins className="h-4 w-4 mr-1.5"/>
                <span className="font-semibold">{formatCredit(creditValue)}</span>
            </Badge>
          )}
          
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full transition-all">
            <Link href="/account">
              <User className="h-6 w-6" />
              <span className="sr-only">Tài khoản</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
