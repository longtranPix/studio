
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { Button } from '@/components/ui/button';
import { User, Loader2, History } from "lucide-react"; 
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
        <div className="mx-auto flex max-w-2xl items-center gap-3 sm:gap-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40ZM20 30C25.5228 30 30 25.5228 30 20C30 14.4772 25.5228 10 20 10C14.4772 10 10 14.4772 10 20C10 25.5228 14.4772 30 20 30Z"
              fill="white"
            />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold text-white">Voice</span>
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
        <p>&copy; {new Date().getFullYear()} Voice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
