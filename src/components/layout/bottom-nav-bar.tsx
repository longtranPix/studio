
// src/components/layout/bottom-nav-bar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, History, User, Package, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Ghi âm', icon: Mic },
  { href: '/history', label: 'Đơn hàng', icon: History },
  { href: '/products', label: 'Hàng hóa', icon: Package },
  { href: '/docs', label: 'Hướng dẫn', icon: BookText },
  { href: '/account', label: 'Cá nhân', icon: User },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border/50 bg-background/80 backdrop-blur-sm md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors w-1/5',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
