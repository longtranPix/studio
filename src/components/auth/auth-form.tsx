
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation'; 
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { signInUser, signUpUser, checkUsernameExists } from '@/api';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  business_name: z.string().min(1, 'Tên doanh nghiệp là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu của bạn'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export interface UserRecord {
  id: string;
  fields: {
    username: string;
    business_name: string;
    table_order_id: string;
    table_order_detail_id: string;
  };
}

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { toast } = useToast();
  const router = useRouter(); 
  const login = useAuthStore((state) => state.login);

  const currentSchema = mode === 'login' ? loginSchema : registerSchema;

  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      username: '',
      password: '',
      ...(mode === 'register' && { confirmPassword: '', business_name: '' }),
    },
    mode: 'onChange', 
  });

  const { register, handleSubmit, formState: { errors, isValid }, setError, clearErrors, watch, trigger, reset } = form;
  const usernameValue = watch('username');

  const { mutate: checkUser, isPending: isCheckingUsername } = useMutation({
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

  const { mutate: signIn, isPending: isSigningIn } = useMutation({
    mutationFn: signInUser,
    onSuccess: (data) => {
        toast({ title: 'Đăng Nhập Thành Công', description: 'Chào mừng trở lại!' });
        login(data);
        router.push('/');
    },
    onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Kiểm tra thông tin đăng nhập của bạn.';
        toast({ title: 'Đăng Nhập Thất Bại', description: message, variant: 'destructive' });
    }
  });

  const { mutate: signUp, isPending: isSigningUp } = useMutation({
      mutationFn: signUpUser,
      onSuccess: () => {
          toast({ title: 'Đăng Ký Thành Công', description: 'Bây giờ bạn có thể đăng nhập.' });
          setMode('login');
          reset({ username: usernameValue, password: '' });
      },
      onError: (error: any) => {
          const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
          toast({ title: 'Đăng Ký Thất Bại', description: message, variant: 'destructive' });
      }
  });

  const handleUsernameBlur = async () => {
    if (mode !== 'register' || !usernameValue || usernameValue.length < 3) return;
    const isValidSyntax = await trigger('username');
    if (isValidSyntax) {
        checkUser(usernameValue);
    }
  };

  const onSubmit = (data: LoginFormValues | RegisterFormValues) => {
    if (mode === 'login') {
      signIn(data as LoginFormValues);
    } else {
      if (errors.username) return;
      signUp(data as RegisterFormValues);
    }
  };

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    reset({username: '', password: '', ...(mode === 'login' && { confirmPassword: '', business_name: '' })}); 
    clearErrors();
  };

  const isLoading = isSigningIn || isSigningUp || isCheckingUsername;

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          {mode === 'login' ? <LogIn className="mr-2 h-7 w-7 text-primary" /> : <UserPlus className="mr-2 h-7 w-7 text-primary" />}
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Truy cập tài khoản VocalNote của bạn.' : 'Tạo tài khoản VocalNote mới.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                {...register('username')}
                onBlur={mode === 'register' ? handleUsernameBlur : undefined}
                className={errors.username ? 'border-destructive' : ''}
              />
              {isCheckingUsername && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {errors.username && <p className="text-sm text-destructive">{errors.username.message as string}</p>}
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="business_name">Tên doanh nghiệp</Label>
              <Input
                id="business_name"
                type="text"
                {...register('business_name')}
                className={errors.business_name ? 'border-destructive' : ''}
              />
              {errors.business_name && <p className="text-sm text-destructive">{errors.business_name.message as string}</p>}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Xác nhận Mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message as string}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </Button>
          <Button variant="link" type="button" onClick={toggleMode} className="text-sm">
            {mode === 'login' ? "Chưa có tài khoản? Đăng ký tại đây" : 'Đã có tài khoản? Đăng nhập tại đây'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
