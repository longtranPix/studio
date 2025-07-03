
import AuthForm from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-foreground">
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <header className="mb-8 text-center">
            <h1 className="text-5xl font-headline bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text pb-2">
              Nola
            </h1>
            <p className="text-muted-foreground">
              Nói nhẹ, việc xong.
            </p>
        </header>

        <main>
          <AuthForm />
        </main>
      </div>
    </div>
  );
}
