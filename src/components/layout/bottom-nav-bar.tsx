
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, History, User, BarChart3, BookText } from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Trang chủ',
    icon: Home,
  },
  {
    href: '/history',
    label: 'Đơn hàng',
    icon: History,
  },
  {
    href: '/report',
    label: 'Báo cáo',
    icon: BarChart3,
  },
  {
    href: '/docs',
    label: 'Hướng dẫn',
    icon: BookText,
  },
  {
    href: '/account',
    label: 'Tài khoản',
    icon: User,
  },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/50 md:hidden">
      <div className="grid grid-cols-5 items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
