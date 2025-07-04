'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { useAuthStore } from '@/store/auth-store';
import { HomePageHeader } from '@/components/home/home-page-header';
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
    <div className="flex flex-1 w-full flex-col bg-background">
      <HomePageHeader />

      <main className="flex flex-col items-center w-full px-4 flex-grow pt-8 bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        <AudioRecorder />
      </main>
    </div>
  );
}
