
'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { AppFooter } from '@/components/layout/app-footer';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthPage && <AppHeader />}
      <main className={cn(
        "flex flex-1 flex-col",
        !isAuthPage && "pb-16 md:pb-0"
      )}>
        {children}
      </main>
      {!isAuthPage && <AppFooter />}
      {!isAuthPage && <BottomNavBar />}
    </div>
  );
}
