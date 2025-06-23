
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { useSignIn, useSignUp, useCheckUsername } from '@/hooks/use-auth';


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

  const { mutate: checkUser, isPending: isCheckingUsername } = useCheckUsername({ setError, clearErrors });
  const { mutate: signIn, isPending: isSigningIn } = useSignIn();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp(() => {
      setMode('login');
      reset({ username: usernameValue, password: '' });
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
          {mode === 'login' ? 'Truy cập tài khoản InvoVoice của bạn.' : 'Tạo tài khoản InvoVoice mới.'}
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
