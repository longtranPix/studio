
import AuthForm from "@/components/auth/auth-form";
import { MessageSquareText } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <header className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4 bg-primary/20 text-primary rounded-full p-3 sm:p-4">
            <MessageSquareText className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Voice</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">Chuyển giọng nói, thành hóa đơn.</p>
        </header>

        <main>
          <AuthForm />
        </main>
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Voice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
