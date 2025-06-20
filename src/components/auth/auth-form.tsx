
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const TEABLE_USER_TABLE_API_URL = 'https://app.teable.io/api/table/tblv9Ou1thzbETynKn1/record';
const TEABLE_AUTH_TOKEN = 'teable_accT1cTLbgDxAw73HQa_xnRuWiEDLat6qqpUDsL4QEzwnKwnkU9ErG7zgJKJswg='; // Consider moving to env var if sensitive or changes
const SIGNUP_API_URL = 'https://order-voice.appmkt.vn/signup';
const SIGNIN_API_URL = 'https://order-voice.appmkt.vn/signin';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu của bạn'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); 

  const currentSchema = mode === 'login' ? loginSchema : registerSchema;

  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      username: '',
      password: '',
      ...(mode === 'register' && { confirmPassword: '' }),
    },
    mode: 'onChange', 
  });

  const { register, handleSubmit, formState: { errors, isValid }, setError, clearErrors, watch, trigger, reset } = form;
  const usernameValue = watch('username');

  const handleUsernameBlur = async () => {
    if (mode !== 'register' || !usernameValue || usernameValue.length < 3) {
      if (errors.username?.type === 'manual') clearErrors('username');
      return;
    }

    const isValidSyntax = await trigger('username');
    if (!isValidSyntax) return;

    setIsCheckingUsername(true);
    try {
      const response = await axios.get(TEABLE_USER_TABLE_API_URL, {
        params: {
          fieldKeyType: 'dbFieldName',
          filter: JSON.stringify({
            conjunction: 'and',
            filterSet: [{ fieldId: 'username', operator: 'is', value: usernameValue }],
          }),
        },
        headers: {
          'Authorization': `Bearer ${TEABLE_AUTH_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (response.data.records && response.data.records.length > 0) {
        setError('username', { type: 'manual', message: 'Tên đăng nhập đã được sử dụng' });
      } else {
        clearErrors('username'); 
      }
    } catch (error) {
      console.error('Lỗi kiểm tra tên đăng nhập:', error);
      toast({
        title: 'Kiểm Tra Tên Thất Bại',
        description: 'Không thể xác minh tính duy nhất của tên đăng nhập. Vui lòng thử gửi lại.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const onSubmit = async (data: LoginFormValues | RegisterFormValues) => {
    setIsLoading(true);

    if (mode === 'register') {
      const registerData = data as RegisterFormValues;
      
      if (errors.username?.type === 'manual') {
        setIsLoading(false);
        return;
      }
      
      if (usernameValue && usernameValue.length >=3 && !errors.username) { 
        setIsCheckingUsername(true);
        try {
          const response = await axios.get(TEABLE_USER_TABLE_API_URL, {
            params: {
              fieldKeyType: 'dbFieldName',
              filter: JSON.stringify({
                conjunction: 'and',
                filterSet: [{ fieldId: 'username', operator: 'is', value: registerData.username }],
              }),
            },
            headers: {
              'Authorization': `Bearer ${TEABLE_AUTH_TOKEN}`,
              'Accept': 'application/json',
            },
          });
          if (response.data.records && response.data.records.length > 0) {
            setError('username', { type: 'manual', message: 'Tên đăng nhập đã được sử dụng' });
            setIsLoading(false);
            setIsCheckingUsername(false);
            return;
          }
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể xác minh tên đăng nhập trong quá trình gửi.', variant: 'destructive'});
            setIsLoading(false);
            setIsCheckingUsername(false);
            return;
        }
        setIsCheckingUsername(false);
      } else if (errors.username) { 
        setIsLoading(false);
        return;
      }

      try {
        await axios.post(SIGNUP_API_URL, {
          username: registerData.username,
          password: registerData.password,
        });
        toast({ title: 'Đăng Ký Thành Công', description: 'Bây giờ bạn có thể đăng nhập.' });

        const teableBaseId = process.env.NEXT_PUBLIC_TEABLE_BASE_ID; 
        
        if (teableBaseId) {
          const createTableUrl = `https://app.teable.io/api/base/${teableBaseId}/table/`;
          const tablePayload = {
            name: "Invoice Table",
            dbTableName: "invoice_table",
            description: "Table for invoices",
            icon: "🧾",
            fields: [
              {
                type: "longText",
                name: "Invoice Template",
                dbFieldName: "invoice_template",
                description: "Main template field",
                isPrimary: true,
                notNull: true
              },
              {
                type: "multipleSelect",
                name: "Order Code",
                dbFieldName: "order_code",
                description: "Multiple order codes",
                options: {
                  optionType: "free"
                }
              }
            ],
            fieldKeyType: "dbFieldName"
          };

          try {
            await axios.post(createTableUrl, tablePayload, {
              headers: {
                'Authorization': `Bearer ${TEABLE_AUTH_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });
            toast({ title: 'Bảng Hóa Đơn Đã Tạo', description: 'Bảng cho hóa đơn đã được tạo thành công trong Teable.' });
          } catch (tableError: any) {
            console.error('Lỗi tạo bảng Teable:', tableError);
            const tableErrorMessage = tableError.response?.data?.message || tableError.message || 'Không thể tạo bảng hóa đơn trong Teable.';
            toast({
              title: 'Lỗi Tạo Bảng Teable',
              description: tableErrorMessage,
              variant: 'destructive',
            });
          }
        } else {
          console.warn('NEXT_PUBLIC_TEABLE_BASE_ID is not set. Skipping Teable table creation.');
          toast({
            title: 'Thiếu Cấu Hình Teable',
            description: 'Không thể tạo bảng hóa đơn tự động do thiếu base ID. Vui lòng liên hệ quản trị viên.',
            variant: 'destructive',
            duration: 7000,
          });
        }

        setMode('login');
        reset({ username: registerData.username, password: ''}); 
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        toast({ title: 'Đăng Ký Thất Bại', description: message, variant: 'destructive' });
      }
    } else {
      // Login mode
      const loginData = data as LoginFormValues;
      try {
         await axios.post(SIGNIN_API_URL, {
           username: loginData.username,
           password: loginData.password,
         });

        toast({ title: 'Đăng Nhập Thành Công', description: 'Chào mừng trở lại!' });
        localStorage.setItem('isLoggedIn', 'true'); 
        localStorage.setItem('username', loginData.username);
        router.push('/'); 
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Kiểm tra thông tin đăng nhập của bạn.';
        toast({ title: 'Đăng Nhập Thất Bại', description: message, variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    reset({username: '', password: '', ...(mode === 'login' && { confirmPassword: '' })}); 
    clearErrors();
  };

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
          <Button type="submit" className="w-full" disabled={isLoading || isCheckingUsername || !isValid}>
            {isLoading || isCheckingUsername ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
