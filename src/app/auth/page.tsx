
import AuthForm from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <KeyRound className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">Xác thực InvoVoice</h1>
        <p className="text-xl text-muted-foreground mt-2">Truy cập tài khoản của bạn hoặc tạo tài khoản mới.</p>
      </header>

      <main className="w-full max-w-md">
        <AuthForm />
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} InvoVoice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
