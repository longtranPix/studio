
// src/components/layout/bottom-nav-bar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, History, User, Package, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/history', label: 'Đơn hàng', icon: History },
  { href: '/products', label: 'Hàng hóa', icon: Package },
  { href: '/docs', label: 'Hướng dẫn', icon: BookText },
  { href: '/account', label: 'Cá nhân', icon: User },
];

const recordItem = { href: '/', label: '', icon: Mic };

export function BottomNavBar() {
  const pathname = usePathname();

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-border/50 bg-background/80 backdrop-blur-sm md:hidden">
        <div className="relative flex h-full items-center justify-around">
            {/* Left Items */}
            <div className="flex w-2/5 justify-around">
                {leftItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors w-1/2',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                    </Link>
                    );
                })}
            </div>

            {/* Center Record Button */}
            <div className="absolute left-1/2 top-1/2 z-10 w-1/5 -translate-x-1/2 -translate-y-[calc(50%+12px)]">
                 <Link href={recordItem.href} className="relative flex flex-col items-center justify-center gap-1 text-xs font-medium">
                    <div className={cn(
                        "relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform duration-300 hover:scale-110",
                        pathname === recordItem.href && "animate-pulse-strong"
                    )}>
                        <recordItem.icon className="h-10 w-10" strokeWidth={2}/>
                    </div>
                    <span className={cn("mt-1 font-semibold", pathname === recordItem.href ? "text-primary" : "text-muted-foreground")}>{recordItem.label}</span>
                </Link>
            </div>

            {/* Right Items */}
            <div className="flex w-2/5 justify-around">
                {rightItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors w-1/2',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                    </Link>
                    );
                })}
            </div>
        </div>
    </nav>
  );
}
