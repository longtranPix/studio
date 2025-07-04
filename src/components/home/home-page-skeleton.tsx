import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="flex flex-1 w-full flex-col bg-background">
      <header className="w-full bg-gradient-to-r from-primary to-accent p-4 shadow-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <div>
              <Skeleton className="h-6 w-16 bg-white/20" />
              <Skeleton className="h-3 w-24 mt-1 bg-white/20" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Skeleton className="h-9 w-28 rounded-lg bg-white/10" />
            <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
          </div>
        </div>
      </header>
      <main className="flex flex-col items-center w-full px-4 flex-grow pt-8 bg-gray-50">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="w-full h-72 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
