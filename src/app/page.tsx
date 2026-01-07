'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import PhotoCapture from "@/components/photo-capture";
import { useAuthStore } from '@/store/auth-store';
import { HomePageSkeleton } from '@/components/home/home-page-skeleton';
import { Mic, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';


export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [activeMode, setActiveMode] = useState<'voice' | 'photo'>('voice');

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
      <main className="flex flex-col items-center w-full px-4 flex-grow pt-6 bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        <div className="w-full max-w-2xl mb-8 flex justify-center items-center gap-4">
          <div className={cn("transition-colors", activeMode === 'voice' ? "text-primary" : "text-slate-400")}>
            <Mic className="w-6 h-6" />
          </div>
          <Switch
            checked={activeMode === 'photo'}
            onCheckedChange={(checked) => setActiveMode(checked ? 'photo' : 'voice')}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 h-7 w-12"
          />
          <div className={cn("transition-colors", activeMode === 'photo' ? "text-primary" : "text-slate-400")}>
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {activeMode === 'voice' ? <AudioRecorder /> : <PhotoCapture />}
      </main>
    </div>
  );
}
