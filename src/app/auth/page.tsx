
import AuthForm from "@/components/auth/auth-form";
import { Voicemail } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4 bg-primary/20 text-primary rounded-full p-4">
            <Voicemail className="w-16 h-16" />
          </div>
          <h1 className="text-5xl font-bold font-headline text-primary">InvoVoice</h1>
          <p className="text-xl text-muted-foreground mt-2">Ghi âm giọng nói, tạo hoá đơn tức thì.</p>
        </header>

        <main>
          <AuthForm />
        </main>
      </div>
      <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} InvoVoice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
