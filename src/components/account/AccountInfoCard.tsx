// src/components/account/AccountInfoCard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Calendar, Clock, Package, Hash, Edit, Save, X, Loader2, Landmark, User, CreditCard, ShieldCheck } from 'lucide-react';
import type { ProfileData, UpdateProfilePayload, BankInfo } from '@/types/order';
import { useUpdateProfile, useBanks } from '@/hooks/use-profile';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/shared/combobox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { data: banks, isLoading: isLoadingBanks } = useBanks();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile({
    onSuccess: () => {
      setIsEditing(false);
      setIsPasswordDialogOpen(false);
      setPassword('');
      setPasswordError('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Mật khẩu không hợp lệ hoặc đã có lỗi xảy ra.';
      setPasswordError(message);
    }
  });
  
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

  const hasBankInfoChanged = useMemo(() => {
    return initialProfile.bank_name !== editableProfile.bank_name ||
           initialProfile.bank_number !== editableProfile.bank_number ||
           initialProfile.account_name !== editableProfile.account_name;
  }, [initialProfile, editableProfile]);

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
  
  const buildPayload = (): UpdateProfilePayload => {
    const payload: UpdateProfilePayload = {};
    for (const key in editableProfile) {
        const typedKey = key as keyof typeof editableProfile;
        if (editableProfile[typedKey] !== initialProfile[typedKey]) {
            (payload as any)[typedKey] = editableProfile[typedKey];
        }
    }
    return payload;
  }

  const handleSave = () => {
    if (!hasChanges) return;

    if (hasBankInfoChanged) {
      setPassword('');
      setPasswordError('');
      setIsPasswordDialogOpen(true);
    } else {
      const payload = buildPayload();
      if (Object.keys(payload).length > 0) {
          updateProfile(payload);
      } else {
          setIsEditing(false); // No changes to save
      }
    }
  };
  
  const handlePasswordSubmit = () => {
    if (!password) {
        setPasswordError('Vui lòng nhập mật khẩu của bạn.');
        return;
    }
    const payload = buildPayload();
    payload.password = password;
    updateProfile(payload);
  }

  return (
    <>
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck/>Xác nhận mật khẩu</DialogTitle>
            <DialogDescription>
              Để bảo mật, vui lòng nhập mật khẩu của bạn để lưu các thay đổi liên quan đến thông tin ngân hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Hủy</Button>
            <Button onClick={handlePasswordSubmit} disabled={isUpdatingProfile}>
                {isUpdatingProfile && <Loader2 className="animate-spin" />}
                Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
        <main>
          <Card className="shadow-lg rounded-2xl border-none bg-card">
            <CardContent className="p-6 relative">
              
              <div className="absolute top-4 right-4">
                {isEditing ? (
                    <div className="flex gap-2">
                        <Button onClick={handleEditToggle} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={isUpdatingProfile || !hasChanges}>
                            {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                            Lưu
                        </Button>
                    </div>
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
                    <div className="mt-4 flex w-full max-w-sm items-center">
                       <Label className="w-[40%] text-left">Tên doanh nghiệp</Label>
                       <Input value={editableProfile.business_name || ''} onChange={(e) => handleFieldChange('business_name', e.target.value)} className="flex-1 text-lg font-medium" autoFocus />
                    </div>
                  ) : (
                    <>
                      <p className="text-xl font-medium">{initialProfile.business_name || 'Chưa có tên doanh nghiệp'}</p>
                      <p className="text-sm text-muted-foreground mt-1">@{username}</p>
                    </>
                  )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-5 text-base">
                <h3 className="text-lg font-semibold text-primary mb-4">Thông tin chung</h3>
                <div className="flex items-center">
                    <Label className="w-[40%] flex items-center gap-4"><Hash className="w-5 h-5 text-primary" /> Mã số thuế</Label>
                    {isEditing ? (
                       <div className="w-[60%]"><Input value={editableProfile.tax_code || ''} onChange={(e) => handleFieldChange('tax_code', e.target.value)} /></div>
                    ) : (
                       <span className="font-medium w-[60%]">{profileData?.tax_code || '(Chưa có)'}</span>
                    )}
                </div>
                <div className="flex items-center">
                    <Label className="w-[40%] flex items-center gap-4"><Package className="w-5 h-5 text-primary" /> Gói đăng ký</Label>
                    <span className="font-medium w-[60%]">{profileData?.current_plan_name || 'Gói Cơ Bản'}</span>
                </div>
                <div className="flex items-center">
                     <Label className="w-[40%] flex items-center gap-4"><Calendar className="w-5 h-5 text-primary" /> Ngày hết hạn</Label>
                    <span className="font-medium w-[60%]">{formatDate(profileData?.time_expired)}</span>
                </div>
                <div className="flex items-center">
                     <Label className="w-[40%] flex items-center gap-4"><Clock className="w-5 h-5 text-primary" /> Đăng nhập lần cuối</Label>
                    <span className="font-medium w-[60%]">{formatDate(profileData?.last_login) || lastLoginDate || 'Không có'}</span>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="space-y-5 text-base">
                  <h3 className="text-lg font-semibold text-primary mb-4">Thông tin ngân hàng</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                        <Label className="w-[40%] flex items-center gap-4"><Landmark className="w-5 h-5 text-primary" /> Ngân hàng</Label>
                        <div className="w-[60%]">
                            {isEditing ? (
                                <Combobox
                                  value={banks?.find(b => b.shortName === editableProfile.bank_name)?.id.toString() || ''}
                                  onValueChange={(_, __, record) => handleBankSelect(record)}
                                  onSearchChange={(term) => handleFieldChange('bank_name', term)}
                                  initialSearchTerm={editableProfile.bank_name || ''}
                                  placeholder="Chọn ngân hàng..."
                                  data={banks || []}
                                  valueFormatter={(bank) => bank.shortName}
                                  displayFormatter={(bank) => `${bank.shortName} - ${bank.name}`}
                                  isLoading={isLoadingBanks}
                                />
                            ) : (
                                <span className="font-medium">{initialProfile.bank_name || '(Chưa có)'}</span>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center">
                        <Label className="w-[40%] flex items-center gap-4"><CreditCard className="w-5 h-5 text-primary" /> Số tài khoản</Label>
                        <div className="w-[60%]">
                            {isEditing ? (
                                <Input value={editableProfile.bank_number || ''} onChange={(e) => handleFieldChange('bank_number', e.target.value)} />
                            ) : (
                                <span className="font-medium">{initialProfile.bank_number || '(Chưa có)'}</span>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center">
                         <Label className="w-[40%] flex items-center gap-4"><User className="w-5 h-5 text-primary" /> Tên chủ tài khoản</Label>
                         <div className="w-[60%]">
                            {isEditing ? (
                                 <Input value={editableProfile.account_name || ''} onChange={(e) => handleFieldChange('account_name', e.target.value)} />
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
    </>
  );
};
