// src/components/account/AccountInfoCard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Calendar, Clock, Package, Hash, Edit, Save, X, Loader2, Landmark, User, CreditCard } from 'lucide-react';
import type { ProfileData, UpdateProfilePayload, BankInfo } from '@/types/order';
import { useUpdateProfile, useBanks } from '@/hooks/use-profile';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/shared/combobox';
import { Label } from '@/components/ui/label';

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
  const [isEditing, setIsEditing] = useState(false);
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

  const fallbackChar = initialProfile.business_name?.charAt(0).toUpperCase() || 'U';

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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { // When switching from editing to view mode
      setEditableProfile(initialProfile); // Discard changes
    }
  };

  const handleFieldChange = (field: keyof typeof editableProfile, value: string) => {
    setEditableProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleBankSelect = (bank: BankInfo) => {
    handleFieldChange('bank_name', bank.shortName);
  }

  const handleSave = () => {
    if (!hasChanges) return;

    // Build payload with only changed fields
    const payload: UpdateProfilePayload = {};
    for (const key in editableProfile) {
        const typedKey = key as keyof typeof editableProfile;
        if (editableProfile[typedKey] !== initialProfile[typedKey]) {
            (payload as any)[typedKey] = editableProfile[typedKey];
        }
    }

    if (Object.keys(payload).length > 0) {
        updateProfile(payload, {
          onSuccess: () => {
            setIsEditing(false);
          },
        });
    } else {
        setIsEditing(false); // No changes to save
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <main>
        <Card className="shadow-lg rounded-2xl border-none bg-card">
          <CardContent className="p-6 relative">
            
            <div className="absolute top-4 right-4">
              {isEditing ? (
                  <Button onClick={handleSave} size="sm" disabled={isUpdatingProfile || !hasChanges}>
                      {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                      Lưu
                  </Button>
              ) : (
                  <Button onClick={handleEditToggle} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Edit className="h-4 w-4" />
                  </Button>
              )}
            </div>

            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                <AvatarFallback className="text-3xl">{fallbackChar}</AvatarFallback>
              </Avatar>
               {isEditing ? (
                  <div className="mt-4 space-y-3 w-full max-w-sm">
                     <Label className="text-left w-full block">Tên doanh nghiệp</Label>
                     <Input value={editableProfile.business_name || ''} onChange={(e) => handleFieldChange('business_name', e.target.value)} className="text-center text-lg font-medium" autoFocus />
                  </div>
                ) : (
                  <p className="text-xl font-medium">{initialProfile.business_name || 'Chưa có tên doanh nghiệp'}</p>
                )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-5 text-base">
              <h3 className="text-lg font-semibold text-primary mb-4">Thông tin chung</h3>
              <div className="flex items-center">
                <Hash className="w-5 h-5 mr-4 text-primary" />
                <div className="flex flex-col flex-1">
                  <span className="text-xs text-muted-foreground">Mã số thuế</span>
                  {isEditing ? (
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

            <Separator className="my-6" />
            
            <div className="space-y-5 text-base">
                <h3 className="text-lg font-semibold text-primary mb-4">Thông tin ngân hàng</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                      <Landmark className="w-5 h-5 mr-4 text-primary" />
                      <div className="flex flex-col flex-1">
                          <span className="text-xs text-muted-foreground">Ngân hàng</span>
                          {isEditing ? (
                              <Combobox
                                value={editableProfile.bank_name || ''}
                                onValueChange={(_, __, record) => handleBankSelect(record)}
                                onSearchChange={(term) => handleFieldChange('bank_name', term)}
                                initialSearchTerm={editableProfile.bank_name || ''}
                                placeholder="Chọn ngân hàng..."
                                data={banks || []}
                                valueFormatter={(bank) => `${bank.shortName} - ${bank.name}`}
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
                          {isEditing ? (
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
                          {isEditing ? (
                               <Input value={editableProfile.account_name || ''} onChange={(e) => handleFieldChange('account_name', e.target.value)} className="mt-1" />
                          ) : (
                              <span className="font-medium">{initialProfile.account_name || '(Chưa có)'}</span>
                          )}
                      </div>
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
