
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { useAuthStore } from '@/store/auth-store';
import { HomePageSkeleton } from '@/components/home/home-page-skeleton';
import { useRecordingStore } from '@/store/recording-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { recordingTrigger, clearRecordingTrigger } = useRecordingStore();
  const recorderRef = useRef<{ startRecording: () => void }>(null);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  useEffect(() => {
    if (recordingTrigger && isAuthenticated) {
        // Use a short timeout to ensure the component is ready
        setTimeout(() => {
             recorderRef.current?.startRecording();
        }, 100);
        clearRecordingTrigger();
    }
  }, [recordingTrigger, isAuthenticated, clearRecordingTrigger]);


  if (!_hasHydrated || !isAuthenticated) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-900 dark:via-black dark:to-cyan-900/20">
      <AudioRecorder ref={recorderRef} />
    </div>
  );
}
