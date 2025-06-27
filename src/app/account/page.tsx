
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ChevronLeft, Mail, Calendar, Clock, Package, Hash } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton } from '@/components/ui/skeleton';

const AccountPageSkeleton = () => (
  <div className="w-full max-w-md mx-auto">
    <header className="mb-3">
      <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4">
        <Link href="/">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Quay về trang chủ
        </Link>
      </Button>
    </header>
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

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, username, businessName, logout, _hasHydrated } = useAuthStore();
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useProfile();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
    if (isAuthenticated) {
      setLastLoginDate(new Date().toLocaleDateString('vi-VN'));
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const renderContent = () => {
    if (!_hasHydrated || !isAuthenticated || isLoadingProfile) {
      return <AccountPageSkeleton />;
    }

    if (profileError) {
      console.error('Profile loading error:', profileError);
    }

    const finalBusinessName = profileData?.fields?.business_name || businessName;
    const fallbackChar = finalBusinessName?.charAt(0).toUpperCase() || 'U';

    return (
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <header className="mb-3">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4">
            <Link href="/">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Quay về trang chủ
            </Link>
          </Button>
        </header>

        <main>
          <Card className="shadow-lg rounded-2xl border-none bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20 animate-pulse-subtle">
                  {/* <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" alt="Ảnh đại diện người dùng" /> */}
                  <AvatarFallback className="text-4xl">{fallbackChar}</AvatarFallback>
                </Avatar>
                <p className="text-lg font-medium">{(profileData && 'fields' in profileData) ? profileData.fields.business_name : businessName || 'Chưa có tên doanh nghiệp'}</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-5 text-sm">
                <div className="flex items-center">
                  <Hash className="w-5 h-5 mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Mã số thuế</span>
                    <span className="font-medium">{(profileData && 'fields' in profileData) ? profileData.fields.username : username || 'Không có'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="font-medium">{(profileData && 'fields' in profileData) ? profileData.fields.email : `${username?.toLowerCase()}@example.com` || 'user@example.com'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Gói đăng ký</span>
                    <span className="font-medium">{(profileData && 'fields' in profileData) ? profileData.fields.package : 'Gói Cơ Bản'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ngày tham gia</span>
                    <span className="font-medium">{(profileData && 'createdTime' in profileData) ? new Date(profileData.createdTime).toLocaleDateString('vi-VN') : 'Không có'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Đăng nhập lần cuối</span>
                    <span className="font-medium">{(profileData && 'fields' in profileData && profileData.fields.last_login) ? new Date(profileData.fields.last_login).toLocaleDateString('vi-VN') : lastLoginDate || 'Không có'}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleLogout} variant="destructive" className="w-full mt-8 text-base py-6 font-semibold">
                <LogOut className="w-5 h-5 mr-2" />
                Đăng xuất
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center p-4 sm:p-6 pt-8 bg-gray-50 dark:bg-black">
      {renderContent()}
    </div>
  );
}
