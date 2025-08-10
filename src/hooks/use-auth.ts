
'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { signInUser, signUpUser, checkUsernameExists, fetchViewsForTable, getPlanStatus } from '@/api';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';

export function useSignIn() {
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { setCreditValue, setPlanStatus } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const signInData = await signInUser(credentials);

      if (signInData && signInData.record && signInData.record.length > 0 && signInData.record[0]?.fields?.access_token) {
        const userRecord = signInData.record[0];
        const accessToken = userRecord.fields.access_token;
        
        const { 
          table_product_id: productTableId,
          table_brand_id: brandTableId,
          table_attribute_id: attributeTableId,
          current_plan
        } = userRecord.fields;

        const currentPlanId = current_plan?.id;

        // Temporarily set token for the next API calls
        useAuthStore.setState({ accessToken });

        if (!productTableId || !brandTableId || !attributeTableId) {
          throw new Error("One or more required table IDs are not found in the user record.");
        }

        const [productViews, brandViews, attributeViews] = await Promise.all([
          fetchViewsForTable(productTableId),
          fetchViewsForTable(brandTableId),
          fetchViewsForTable(attributeTableId),
        ]);

        const findDevViewId = (views: any[], tableName: string) => {
          if (!views || views.length === 0) throw new Error(`No views found for the ${tableName} table.`);
          const devView = views.find(v => v.name === 'dev');
          return devView ? devView.id : views[0].id;
        }
        
        const productViewId = findDevViewId(productViews, 'product');
        const brandViewId = findDevViewId(brandViews, 'brand');
        const attributeViewId = findDevViewId(attributeViews, 'attribute');

        // Fetch plan status to get credit_value
        if (currentPlanId) {
            const planStatusResponse = await getPlanStatus(currentPlanId);
            const planFields = planStatusResponse.data.fields;
            setCreditValue(planFields.credit_value);
            setPlanStatus(planFields.status as 'active' | 'inactive');
        } else {
            setCreditValue(null);
            setPlanStatus(null);
        }

        return { userRecord, accessToken, productViewId, brandViewId, attributeViewId };
      }
      
      throw new Error("Invalid sign-in response.");
    },
    onSuccess: (data) => {
      login(data as any);
      toast({ title: 'Đăng Nhập Thành Công', description: 'Chào mừng trở lại!' });
      router.push('/');
    },
    onError: (error: any) => {
      // Clear token if any error occurs
      useAuthStore.setState({ accessToken: null });
      const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Đã có lỗi xảy ra.';
      toast({ title: 'Đăng Nhập Thất Bại', description: message, variant: 'destructive' });
    },
  });
}

export function useSignUp(onSuccessCallback: () => void) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: (userData: RegisterFormValues) => {
          const { confirmPassword, ...apiData } = userData;
          return signUpUser(apiData);
        },
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
                setError('username', { type: 'manual', message: 'Mã số thuế đã được sử dụng' });
            } else {
                clearErrors('username');
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể kiểm tra mã số thuế.';
            toast({ title: 'Lỗi', description: message, variant: 'destructive' });
        }
    });
}

    