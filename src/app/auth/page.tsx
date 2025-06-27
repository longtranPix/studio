
import AuthForm from "@/components/auth/auth-form";
import { Mic } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <header className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
                <Mic className="h-12 w-12 text-primary" strokeWidth={1.5} />
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter text-foreground" style={{ fontFamily: "'Arial Black', 'Helvetica Bold', sans-serif" }}>TEIX</h1>
                    <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground -mt-1">VOICE IS ALL</p>
                </div>
            </div>
          <p className="text-lg sm:text-xl text-muted-foreground mt-4">Chuyển giọng nói, thành hóa đơn.</p>
        </header>

        <main>
          <AuthForm />
        </main>
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TEIX. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
