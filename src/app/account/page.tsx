
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ChevronLeft, UserCircle as UserIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);


  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUsername = localStorage.getItem('username');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
      setUsername(storedUsername || 'Người dùng'); 
      setLastLoginDate(new Date().toLocaleDateString('vi-VN'));
    } else {
      router.push('/auth');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('table_order_id');
    localStorage.removeItem('table_order_detail_id');
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Đang tải tài khoản...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <header className="w-full max-w-md mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <UserIcon className="w-24 h-24 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline text-primary">Thông Tin Tài Khoản</h1>
        <p className="text-lg text-muted-foreground mt-2">Quản lý chi tiết tài khoản của bạn.</p>
      </header>

      <main className="w-full max-w-md">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle>Hồ Sơ</CardTitle>
            <CardDescription>Thông tin cá nhân của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" alt="Ảnh đại diện người dùng" />
                <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{username}</p>
                <p className="text-sm text-muted-foreground">{username ? `${username.toLowerCase()}@example.com` : 'user@example.com'}</p> 
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-md font-medium text-muted-foreground">Chi tiết:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><span className="font-medium">Gói đăng ký:</span> Gói Cơ Bản</li>
                <li><span className="font-medium">Ngày tham gia:</span> 01/01/2024</li>
                <li><span className="font-medium">Đăng nhập lần cuối:</span> {lastLoginDate || 'Không có'}</li>
              </ul>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full mt-6">
              <LogOut className="w-5 h-5 mr-2" />
              Đăng xuất
            </Button>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link href="/">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Quay về Trang Chủ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VocalNote. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}
