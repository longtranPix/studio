
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
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <header className="w-full bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
            <Mic className="h-8 w-8 text-white" strokeWidth={1.5} />
            <div>
                <h1 className="text-2xl font-bold tracking-tighter text-white" style={{ fontFamily: "'Arial Black', 'Helvetica Bold', sans-serif" }}>TEIX</h1>
                <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/80 -mt-1">VOICE IS ALL</p>
            </div>
        </div>
      </header>

      <div className="flex w-full max-w-2xl mx-auto flex-col sm:flex-row justify-center gap-2 sm:gap-4 py-6 px-4">
        <Button asChild className="h-11 rounded-lg bg-green-500 px-6 text-base font-semibold text-white shadow hover:bg-green-600 w-full sm:w-auto">
           <Link href="/history">
            <History className="mr-2 h-5 w-5" />
            Lịch sử Đơn hàng
          </Link>
        </Button>
         <Button asChild className="h-11 rounded-lg bg-blue-500 px-6 text-base font-semibold text-white shadow hover:bg-blue-600 w-full sm:w-auto">
           <Link href="/account">
            <User className="mr-2 h-5 w-5" />
            Tài khoản
          </Link>
        </Button>
      </div>

      <main className="flex flex-col items-center w-full px-4 flex-grow">
        <AudioRecorder />
      </main>

      <footer className="w-full text-center text-sm text-muted-foreground py-6 mt-12">
        <p>&copy; {new Date().getFullYear()} TEIX. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
