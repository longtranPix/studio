
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useSignIn, useSignUp, useCheckUsername } from '@/hooks/use-auth';


const loginSchema = z.object({
  username: z.string().min(1, 'Mã số thuế là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Mã số thuế phải có ít nhất 3 ký tự'),
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
    upload_file_id: string;
    table_customer_id: string;
    table_product_id: string;
    table_import_slip_details_id: string;
    table_delivery_note_details_id: string;
    table_delivery_note_id: string;
    table_import_slip_id: string;
  };
}

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onChange',
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const isLogin = mode === 'login';

  const usernameValue = isLogin
    ? (loginForm.watch('username') as string)
    : (registerForm.watch('username') as string);

  const { mutate: checkUser, isPending: isCheckingUsername } = useCheckUsername({
    setError: registerForm.setError,
    clearErrors: registerForm.clearErrors
  });
  const { mutate: signIn, isPending: isSigningIn } = useSignIn();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp(() => {
      setMode('login');
      loginForm.reset({ username: usernameValue, password: '' });
  });


  const handleUsernameBlur = async () => {
    if (mode !== 'register' || !usernameValue || usernameValue.length < 3) return;
    const isValidSyntax = await registerForm.trigger('username');
    if (isValidSyntax) {
        checkUser(usernameValue);
    }
  };

  const onSubmit = (data: LoginFormValues | RegisterFormValues) => {
    if (mode === 'login') {
      signIn(data as LoginFormValues);
    } else {
      if (registerForm.formState.errors.username) return;
      signUp(data as RegisterFormValues);
    }
  };

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    setShowPassword(false);
    setShowConfirmPassword(false);
    loginForm.reset();
    registerForm.reset();
    loginForm.clearErrors();
    registerForm.clearErrors();
  };

  const isLoading = isSigningIn || isSigningUp || isCheckingUsername;

  return (
    <Card className="w-full shadow-xl border border-border/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-xl sm:text-2xl font-headline">
            {isLogin ? <LogIn className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" /> : <UserPlus className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />}
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Truy cập tài khoản Nola của bạn.' : 'Tạo tài khoản Nola mới.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={isLogin ? loginForm.handleSubmit(onSubmit) : registerForm.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="username">Mã số thuế</Label>
                  <Input
                    id="username"
                    type="text"
                    {...loginForm.register('username')}
                    className={loginForm.formState.errors.username ? 'border-destructive' : ''}
                  />
                  {loginForm.formState.errors.username && <p className="text-sm text-destructive">{loginForm.formState.errors.username.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...loginForm.register('password')}
                      className={loginForm.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message as string}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="reg_username">Mã số thuế</Label>
                  <div className="relative">
                    <Input
                      id="reg_username"
                      type="text"
                      {...registerForm.register('username')}
                      onBlur={handleUsernameBlur}
                      className={registerForm.formState.errors.username ? 'border-destructive' : ''}
                    />
                    {isCheckingUsername && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {registerForm.formState.errors.username && <p className="text-sm text-destructive">{registerForm.formState.errors.username.message as string}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="reg_password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="reg_password"
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password')}
                        className={registerForm.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message as string}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword">Xác nhận Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerForm.register('confirmPassword')}
                        className={registerForm.formState.errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                      />
                       <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                       </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message as string}</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full font-semibold" size="lg" disabled={isLoading || (isLogin ? !loginForm.formState.isValid : !registerForm.formState.isValid)}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
            <Button variant="link" type="button" onClick={toggleMode} className="text-sm">
              {isLogin ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Đăng nhập tại đây'}
            </Button>
          </CardFooter>
        </form>
      </Card>
  );
}
