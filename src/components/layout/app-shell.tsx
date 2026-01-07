'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppHeader } from './app-header';
import { AppFooter } from './app-footer';
import { BottomNavBar } from './bottom-nav-bar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthPage && <AppHeader />}
      <main className={cn(
        "flex flex-1 flex-col",
        isAuthPage && "pb-16 md:pb-0"
      )}>
        {children}
      </main>
      {isAuthPage && <AppFooter />}
      {!isAuthPage && <BottomNavBar />}
    </div>
  );
}
