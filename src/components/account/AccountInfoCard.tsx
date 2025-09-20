// src/components/account/AccountInfoCard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Calendar, Clock, Package, Hash, Edit, Save, X, Loader2, Landmark, User, CreditCard } from 'lucide-react';
import { useUpdateProfile, useBanks, ProfileData } from '@/hooks/use-profile';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Combobox } from '../shared/combobox';
import { BankInfo, UpdateProfilePayload } from '@/types/profile';

interface AccountInfoCardProps {
  profileData: ProfileData | null;
  username: string | null;
  lastLoginDate: string | null;
  onLogout: () => void;
}

export const AccountInfoCard = ({
  profileData,
  username,
  lastLoginDate,
  onLogout,
}: AccountInfoCardProps) => {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editableProfile, setEditableProfile] = useState<Partial<ProfileData>>({});
  
  const { data: banks, isLoading: isLoadingBanks } = useBanks();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  
  const initialProfile = useMemo(() => ({
    business_name: profileData?.business_name || '',
    tax_code: profileData?.tax_code || '',
    bank_name: profileData?.bank_name || '',
    bank_number: profileData?.bank_number || '',
    account_name: profileData?.account_name || '',
  }), [profileData]);

  const fallbackChar = initialProfile.business_name?.charAt(0).toUpperCase() || username?.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    setEditableProfile(initialProfile);
  }, [initialProfile]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(initialProfile) !== JSON.stringify(editableProfile);
  }, [initialProfile, editableProfile]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Không có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  const handleEditToggle = (section: string) => {
    if (editingSection === section) {
      setEditingSection(null);
      setEditableProfile(initialProfile); // Discard changes
    } else {
      setEditingSection(section);
    }
  };

  const handleFieldChange = (field: keyof typeof editableProfile, value: string) => {
    setEditableProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bank: BankInfo | undefined) => {
    if (bank && bank.shortName) {
      handleFieldChange('bank_name', bank.shortName);
    }
  }

  const handleSave = (section: string) => {
    if (!hasChanges) return;

    // Build payload with only changed fields
    const payload: UpdateProfilePayload = {};
    for (const key in editableProfile) {
        const typedKey = key as keyof typeof editableProfile;
        if (editableProfile[typedKey] !== initialProfile[typedKey as keyof typeof initialProfile]) {
            (payload as any)[typedKey] = editableProfile[typedKey];
        }
    }

    if (Object.keys(payload).length > 0) {
        updateProfile(payload, {
          onSuccess: () => {
            setEditingSection(null);
          },
        });
    } else {
        setEditingSection(null); // No changes to save
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up space-y-6">
      {/* Profile Card */}
      <Card className="shadow-lg rounded-2xl border-none bg-card">
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4">
            {editingSection === 'profile' ? (
              <Button onClick={() => handleSave('profile')} size="sm" disabled={isUpdatingProfile || !hasChanges}>
                {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                Lưu
              </Button>
            ) : (
              <Button onClick={() => handleEditToggle('profile')} variant="ghost" size="sm" className="h-8 px-3">
                <Edit className="h-4 w-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
              <AvatarFallback className="text-3xl">{fallbackChar}</AvatarFallback>
            </Avatar>
            {editingSection === 'profile' ? (
              <div className="mt-4 space-y-3 w-full max-w-sm">
                <Label className="text-left w-full block">Tên doanh nghiệp</Label>
                <Input value={editableProfile.business_name || ''} onChange={(e) => handleFieldChange('business_name', e.target.value)} className="text-center text-lg font-medium" autoFocus />
              </div>
            ) : (
              <>
                <p className="text-xl font-medium">{initialProfile.business_name || 'Chưa có tên doanh nghiệp'}</p>
                <p className="text-sm text-muted-foreground mt-1">@{username}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General Info Card */}
      <Card className="shadow-lg rounded-2xl border-none bg-card">
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4">
            {editingSection === 'general' ? (
              <Button onClick={() => handleSave('general')} size="sm" disabled={isUpdatingProfile || !hasChanges}>
                {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                Lưu
              </Button>
            ) : (
              <Button onClick={() => handleEditToggle('general')} variant="ghost" size="sm" className="h-8 px-3">
                <Edit className="h-4 w-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
          </div>

          <h3 className="text-lg font-semibold text-primary mb-4">Thông tin chung</h3>
          <div className="space-y-5 text-base">
            <div className="flex items-center">
              <Hash className="w-5 h-5 mr-4 text-primary" />
              <div className="flex flex-col flex-1">
                <span className="text-xs text-muted-foreground">Mã số thuế</span>
                {editingSection === 'general' ? (
                  <Input value={editableProfile.tax_code || ''} onChange={(e) => handleFieldChange('tax_code', e.target.value)} className="mt-1" />
                ) : (
                  <span className="font-medium">{profileData?.tax_code || '(Chưa có)'}</span>
                )}
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
        </CardContent>
      </Card>

      {/* Bank Info Card */}
      <Card className="shadow-lg rounded-2xl border-none bg-card">
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4">
            {editingSection === 'bank' ? (
              <Button onClick={() => handleSave('bank')} size="sm" disabled={isUpdatingProfile || !hasChanges}>
                {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                Lưu
              </Button>
            ) : (
              <Button onClick={() => handleEditToggle('bank')} variant="ghost" size="sm" className="h-8 px-3">
                <Edit className="h-4 w-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
          </div>

          <h3 className="text-lg font-semibold text-primary mb-4">Thông tin ngân hàng</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Landmark className="w-5 h-5 mr-4 text-primary" />
              <div className="flex flex-col flex-1">
                <span className="text-xs text-muted-foreground">Ngân hàng</span>
                {editingSection === 'bank' ? (
                  <Combobox
                    value={editableProfile.bank_name || ''}
                    onValueChange={(_, __, record) => handleBankSelect(record)}
                    onSearchChange={(term) => handleFieldChange('bank_name', term)}
                    initialSearchTerm={editableProfile.bank_name || ''}
                    placeholder="Chọn ngân hàng..."
                    data={banks || []}
                    valueFormatter={(bank) => `${bank.shortName}`}
                    displayFormatter={(bank) => bank.name}
                    isLoading={isLoadingBanks}
                    className="mt-1"
                  />
                ) : (
                  <span className="font-medium">{initialProfile.bank_name || '(Chưa có)'}</span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-4 text-primary" />
              <div className="flex flex-col flex-1">
                <span className="text-xs text-muted-foreground">Số tài khoản</span>
                {editingSection === 'bank' ? (
                  <Input value={editableProfile.bank_number || ''} onChange={(e) => handleFieldChange('bank_number', e.target.value)} className="mt-1" />
                ) : (
                  <span className="font-medium">{initialProfile.bank_number || '(Chưa có)'}</span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 mr-4 text-primary" />
              <div className="flex flex-col flex-1">
                <span className="text-xs text-muted-foreground">Tên chủ tài khoản</span>
                {editingSection === 'bank' ? (
                  <Input value={editableProfile.account_name || ''} onChange={(e) => handleFieldChange('account_name', e.target.value)} className="mt-1" />
                ) : (
                  <span className="font-medium">{initialProfile.account_name || '(Chưa có)'}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button - Outside Cards */}
      <div className="pt-4">
        <Button onClick={onLogout} variant="destructive" className="w-full text-base py-6 font-semibold">
          <LogOut className="w-5 h-5 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
};
