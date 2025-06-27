'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { Button } from '@/components/ui/button';
import { User, Loader2, History, Mic } from "lucide-react"; 
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);


  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="w-full bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
                <Mic className="h-8 w-8 text-white" strokeWidth={1.5} />
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter text-white" style={{ fontFamily: "'Arial Black', 'Helvetica Bold', sans-serif" }}>TEIX</h1>
                    <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/80 -mt-1">VOICE IS ALL</p>
                </div>
            </Link>
             <div className="flex items-center gap-2 sm:gap-4">
                <Button asChild variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold rounded-lg transition-all">
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

      <main className="flex flex-col items-center w-full px-4 flex-grow pt-8 bg-gray-50">
        <AudioRecorder />
      </main>

      <footer className="w-full text-center text-sm text-muted-foreground py-6 bg-gray-50">
        <p>&copy; {new Date().getFullYear()} TEIX. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
