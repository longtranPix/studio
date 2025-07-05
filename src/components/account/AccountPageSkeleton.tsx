
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const AccountPageSkeleton = () => (
  <div className="w-full max-w-md mx-auto">
    <main>
      <Card className="shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-5 w-52 mt-2 rounded-md" />
          </div>
          <Separator className="my-6" />
          <div className="space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-3 w-1/4 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full mt-8 rounded-md" />
        </CardContent>
      </Card>
    </main>
  </div>
);
