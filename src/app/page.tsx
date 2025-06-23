
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { Button } from '@/components/ui/button';
import { UserCircle, Loader2, History } from "lucide-react"; 
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full py-3 px-4 sm:px-6 lg:px-8 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Link href="/" passHref>
              <span className="text-2xl sm:text-3xl font-bold font-headline text-primary cursor-pointer">VocalNote</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/history" passHref>
                <Button variant="ghost" size="icon" aria-label="Lịch sử đơn hàng">
                  <History className="w-7 h-7 text-primary hover:text-primary/80" />
                </Button>
              </Link>
              <Link href="/account" passHref>
                <Button variant="ghost" size="icon" aria-label="Tài khoản">
                  <UserCircle className="w-7 h-7 text-primary hover:text-primary/80" />
                </Button>
              </Link>
            </div>
        </div>
      </header>

      <main className="flex flex-col items-center w-full max-w-2xl mx-auto mt-8 px-4 flex-grow">
        <AudioRecorder />
      </main>

      <footer className="w-full text-center text-sm text-muted-foreground py-6 mt-12">
        <p>&copy; {new Date().getFullYear()} VocalNote. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
