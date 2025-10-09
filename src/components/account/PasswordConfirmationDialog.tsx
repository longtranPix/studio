'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert } from 'lucide-react';

interface PasswordConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  isPending: boolean;
}

export function PasswordConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isPending,
}: PasswordConfirmationDialogProps) {
  const [password, setPassword] = useState('');

  const handleConfirmClick = () => {
    if (password) {
      onConfirm(password);
    }
  };
  
  // Reset password on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setPassword(''), 300);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="text-yellow-500" />
            Xác nhận mật khẩu
          </DialogTitle>
          <DialogDescription>
            Để đảm bảo an toàn, vui lòng nhập mật khẩu của bạn để xác nhận thay đổi thông tin ngân hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-confirm" className="text-right">
              Mật khẩu
            </Label>
            <Input
              id="password-confirm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full"
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            onClick={handleConfirmClick}
            disabled={isPending || !password}
            className="w-full"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
