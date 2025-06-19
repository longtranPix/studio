
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Import useRouter

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const TEABLE_API_URL = 'https://app.teable.io/api/table/tblv9Ou1thzbETynKn1/record';
const TEABLE_AUTH_TOKEN = 'teable_accT1cTLbgDxAw73HQa_xnRuWiEDLat6qqpUDsL4QEzwnKwnkU9ErG7zgJKJswg=';
const SIGNUP_API_URL = 'https://order-voice.appmkt.vn/signup';
const SIGNIN_API_URL = 'https://order-voice.appmkt.vn/signin';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

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

  const { register, handleSubmit, formState: { errors }, setError, clearErrors, watch, trigger, reset } = form;
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
      const response = await axios.get(TEABLE_API_URL, {
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
        setError('username', { type: 'manual', message: 'Username already taken' });
      } else {
        clearErrors('username'); 
      }
    } catch (error) {
      console.error('Error checking username:', error);
      toast({
        title: 'Username Check Failed',
        description: 'Could not verify username uniqueness. Please try submitting.',
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
      if (!errors.username) { 
        setIsCheckingUsername(true);
        try {
          const response = await axios.get(TEABLE_API_URL, {
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
            setError('username', { type: 'manual', message: 'Username already taken' });
            setIsLoading(false);
            setIsCheckingUsername(false);
            return;
          }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to verify username during submission.', variant: 'destructive'});
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
        toast({ title: 'Registration Successful', description: 'You can now log in.' });
        setMode('login');
        reset({ username: registerData.username, password: ''}); 
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
        toast({ title: 'Registration Failed', description: message, variant: 'destructive' });
      }
    } else {
      // Login mode
      const loginData = data as LoginFormValues;
      try {
        // Simulate API call for login for now, as the actual endpoint might not be fully functional
        // In a real scenario, this would be:
        // await axios.post(SIGNIN_API_URL, {
        //   username: loginData.username,
        //   password: loginData.password,
        // });
        // For prototype purposes, assume login is successful if API call doesn't throw immediately or use a mock
        console.log("Attempting login with:", loginData);
        // Placeholder for actual API call - we'll assume it "succeeds" for now to test redirection
        // To make it fail, uncomment the real axios.post above and ensure the endpoint is correct.
        // If you have a working signin endpoint, replace the following mock success.
        
        // Mock success for now:
        // await new Promise(resolve => setTimeout(resolve, 500)); 
        // Remove the mock above and use the actual API call when ready:
         await axios.post(SIGNIN_API_URL, {
           username: loginData.username,
           password: loginData.password,
         });

        toast({ title: 'Login Successful', description: 'Welcome back!' });
        localStorage.setItem('isLoggedIn', 'true'); // Set auth flag
        router.push('/'); // Redirect to home page
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Login failed. Check your credentials.';
        toast({ title: 'Login Failed', description: message, variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    reset(); 
    clearErrors();
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          {mode === 'login' ? <LogIn className="mr-2 h-7 w-7 text-primary" /> : <UserPlus className="mr-2 h-7 w-7 text-primary" />}
          {mode === 'login' ? 'Login' : 'Register'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Access your VocalNote account.' : 'Create a new VocalNote account.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
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
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading || isCheckingUsername}>
            {isLoading || isCheckingUsername ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Login' : 'Register'}
          </Button>
          <Button variant="link" type="button" onClick={toggleMode} className="text-sm">
            {mode === 'login' ? "Don't have an account? Register here" : 'Already have an account? Login here'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
