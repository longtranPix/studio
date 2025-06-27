
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { Button } from '@/components/ui/button';
import { User, History, Mic } from "lucide-react"; 
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Skeleton } from '@/components/ui/skeleton';

const HomePageSkeleton = () => (
  <div className="flex flex-1 w-full flex-col bg-background">
    <header className="w-full bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-md sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <div>
                <Skeleton className="h-6 w-16 bg-white/20" />
                <Skeleton className="h-3 w-24 mt-1 bg-white/20" />
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Skeleton className="h-9 w-28 rounded-lg bg-white/10" />
          <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
        </div>
      </div>
    </header>
    <main className="flex flex-col items-center w-full px-4 flex-grow pt-8 bg-gray-50">
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="w-full h-72 rounded-xl" />
      </div>
    </main>
  </div>
);


export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);


  if (!_hasHydrated || !isAuthenticated) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="flex flex-1 w-full flex-col bg-background">
      <header className="w-full bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
                <Mic className="h-8 w-8 text-white" strokeWidth={1.5} />
                <div>
                    <h1 className="text-2xl text-headline text-white font-logo">TEIX</h1>
                    <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/80 -mt-1">VOICE IS ALL</p>
                </div>
            </Link>
             <div className="flex items-center gap-2 sm:gap-4">
                <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all">
                    <Link href="/history">
                        <History className="mr-2 h-5 w-5" />
                        Đơn hàng
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full transition-all">
                    <Link href="/account">
                        <User className="h-6 w-6" />
                        <span className="sr-only">Tài khoản</span>
                    </Link>
                </Button>
            </div>
        </div>
      </header>

      <main className="flex flex-col items-center w-full px-4 flex-grow pt-8 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <AudioRecorder />
      </main>
    </div>
  );
}
