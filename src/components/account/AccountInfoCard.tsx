import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Calendar, Clock, Package, Hash, Shield, Ban } from 'lucide-react';
import type { ProfileData } from '@/hooks/use-profile';

interface AccountInfoCardProps {
  profileData: ProfileData | null;
  username: string | null;
  businessName: string | null;
  lastLoginDate: string | null;
  onLogout: () => void;
}

export const AccountInfoCard = ({
  profileData,
  username,
  businessName,
  lastLoginDate,
  onLogout,
}: AccountInfoCardProps) => {
  const finalBusinessName = profileData?.business_name || businessName;
  const fallbackChar = finalBusinessName?.charAt(0).toUpperCase() || 'U';

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Không có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <main>
        <Card className="shadow-lg rounded-2xl border-none bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20 animate-pulse-subtle">
                <AvatarFallback className="text-3xl">{fallbackChar}</AvatarFallback>
              </Avatar>
              <p className="text-xl font-medium">{finalBusinessName || 'Chưa có tên doanh nghiệp'}</p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-5 text-base">
              <div className="flex items-center">
                <Hash className="w-5 h-5 mr-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Mã số thuế</span>
                  <span className="font-medium">{profileData?.username || username || 'Không có'}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Gói đăng ký</span>
                  <span className="font-medium">{profileData?.current_plan_name || 'Gói Cơ Bản'}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Ngày hết hạn</span>
                  <span className="font-medium">{formatDate(profileData?.time_expired)}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Đăng nhập lần cuối</span>
                  <span className="font-medium">{formatDate(profileData?.last_login) || lastLoginDate || 'Không có'}</span>
                </div>
              </div>
            </div>

            <Button onClick={onLogout} variant="destructive" className="w-full mt-8 text-base py-6 font-semibold">
              <LogOut className="w-5 h-5 mr-2" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};