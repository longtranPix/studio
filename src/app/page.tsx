import AudioRecorder from "@/components/audio-recorder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookHeadphones } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
           <BookHeadphones className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">VocalNote</h1>
        <p className="text-xl text-muted-foreground mt-2">Record your voice, get instant transcriptions.</p>
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
