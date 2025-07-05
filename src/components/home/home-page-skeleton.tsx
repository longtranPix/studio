
import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center w-full px-4 pt-8 bg-gray-50">
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="w-full h-72 rounded-xl" />
      </div>
    </div>
  );
}
