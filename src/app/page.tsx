// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import ImageCapture from "@/components/image-capture"; // New component
import { useAuthStore } from '@/store/auth-store';
import { HomePageSkeleton } from '@/components/home/home-page-skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, Camera } from 'lucide-react';

type Mode = 'audio' | 'camera';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [mode, setMode] = useState<Mode>('audio');

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-900 dark:via-black dark:to-cyan-900/20">
      <div className="flex items-center space-x-3 mb-6">
        <Mic className={`transition-colors ${mode === 'audio' ? 'text-primary' : 'text-muted-foreground'}`} />
        <Switch
          checked={mode === 'camera'}
          onCheckedChange={(checked) => setMode(checked ? 'camera' : 'audio')}
          id="mode-switch"
        />
        <Camera className={`transition-colors ${mode === 'camera' ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>

      {mode === 'audio' ? <AudioRecorder /> : <ImageCapture />}
    </div>
  );
}
