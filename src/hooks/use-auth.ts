'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { signInUser, signUpUser, checkUsernameExists } from '@/api';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';

export function useSignIn() {
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: signInUser,
    onSuccess: (data) => {
      if (data && data.record && data.record.length > 0) {
        toast({ title: 'Đăng Nhập Thành Công', description: 'Chào mừng trở lại!' });
        login(data.record[0]);
        router.push('/');
      } else {
        toast({ title: 'Đăng Nhập Thất Bại', description: 'Không tìm thấy thông tin người dùng. Vui lòng kiểm tra lại.', variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Đã có lỗi xảy ra.';
      toast({ title: 'Đăng Nhập Thất Bại', description: message, variant: 'destructive' });
    },
  });
}

export function useSignUp(onSuccessCallback: () => void) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: signUpUser,
        onSuccess: () => {
            toast({ title: 'Đăng Ký Thành Công', description: 'Bây giờ bạn có thể đăng nhập.' });
            onSuccessCallback();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            toast({ title: 'Đăng Ký Thất Bại', description: message, variant: 'destructive' });
        }
    });
}

// It's a common pattern to pass form methods to hooks when dealing with react-hook-form
type FormMethods = {
    setError: UseFormSetError<RegisterFormValues>;
    clearErrors: UseFormClearErrors<RegisterFormValues>;
}

export function useCheckUsername({ setError, clearErrors }: FormMethods) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: checkUsernameExists,
        onSuccess: (exists) => {
            if (exists) {
                setError('username', { type: 'manual', message: 'Tên đăng nhập đã được sử dụng' });
            } else {
                clearErrors('username');
            }
        },
        onError: (error) => {
            toast({ title: 'Lỗi', description: `Không thể kiểm tra tên người dùng: ${error.message}`, variant: 'destructive' });
        }
    });
}
