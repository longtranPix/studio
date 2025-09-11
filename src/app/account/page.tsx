
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProfile } from '@/hooks/use-profile';
import { AccountPageSkeleton } from '@/components/account/AccountPageSkeleton';
import { AccountInfoCard } from '@/components/account/AccountInfoCard';

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

    return (
      <AccountInfoCard
        profileData={profileData}
        username={username}
        businessName={businessName}
        lastLoginDate={lastLoginDate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center p-4 sm:p-6 pt-8 bg-gray-50 dark:bg-black">
       <div className="w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">
            Tài khoản của bạn
        </h1>
        {renderContent()}
      </div>
    </div>
  );
}
