
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from "@/components/audio-recorder";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookHeadphones, LogOut, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    } else {
      router.push('/auth');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/auth');
    // Optionally, show a toast message for logout
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This case should ideally not be reached due to the redirect in useEffect,
    // but it's a safeguard.
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <header className="relative w-full max-w-2xl mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
           <BookHeadphones className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">VocalNote</h1>
        <p className="text-xl text-muted-foreground mt-2">Record your voice, get instant transcriptions.</p>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          className="absolute top-0 right-0 mt-2 mr-2 sm:mt-0 sm:mr-0"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </header>

      <main className="w-full max-w-2xl">
        <AudioRecorder />
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VocalNote. All rights reserved.</p>
        <p>Powered by Next.js & ShadCN UI</p>
      </footer>
    </div>
  );
}
