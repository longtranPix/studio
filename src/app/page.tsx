// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { useAuthStore } from '@/store/auth-store';
import { HomePageSkeleton } from '@/components/home/home-page-skeleton';

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
    <div className="flex flex-1 flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-900 dark:via-black dark:to-cyan-900/20">
      <AudioRecorder />
    </div>
  );
}
