
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ChevronLeft, User, Building, Mail, Calendar, Clock, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useProfile } from '@/hooks/use-profile';

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, username, businessName, logout, _hasHydrated } = useAuthStore();
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useProfile();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth');
    }
    if(isAuthenticated) {
      setLastLoginDate(new Date().toLocaleDateString('vi-VN'));
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Đang tải tài khoản...</p>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  // Handle profile error gracefully - continue with fallback data
  if (profileError) {
    console.error('Profile loading error:', profileError);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-headline text-primary">Tài Khoản Của Bạn</h1>
          <p className="text-lg text-muted-foreground mt-2">Quản lý thông tin cá nhân và doanh nghiệp.</p>
        </header>

        <main>
          <Card className="shadow-xl rounded-xl border border-border/20">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50">
                  <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" alt="Ảnh đại diện người dùng" />
                  <AvatarFallback className="text-4xl">{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl">{(profileData && 'fields' in profileData) ? profileData.fields.username : username || 'Người dùng'}</CardTitle>
              <CardDescription className="text-base">{(profileData && 'fields' in profileData) ? profileData.fields.business_name : businessName || 'Chưa có tên doanh nghiệp'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4 text-sm border-t pt-6">
                 <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-primary"/>
                    <span>{(profileData && 'fields' in profileData) ? profileData.fields.email : `${username?.toLowerCase()}@example.com` || 'user@example.com'}</span>
                  </div>
                   <div className="flex items-center">
                    <Package className="w-5 h-5 mr-3 text-primary"/>
                    <span><span className="font-medium">Gói đăng ký:</span> {(profileData && 'fields' in profileData) ? profileData.fields.package : 'Gói Cơ Bản'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-primary"/>
                    <span><span className="font-medium">Ngày tham gia:</span> {(profileData && 'createdTime' in profileData) ? new Date(profileData.createdTime).toLocaleDateString('vi-VN') : 'Không có'}</span>
                  </div>
                   <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-primary"/>
                    <span><span className="font-medium">Đăng nhập lần cuối:</span> {(profileData && 'fields' in profileData && profileData.fields.last_login) ? new Date(profileData.fields.last_login).toLocaleDateString('vi-VN') : lastLoginDate || 'Không có'}</span>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/">
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Quay về Trang Chủ
                    </Link>
                  </Button>
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="w-5 h-5 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Voice. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
