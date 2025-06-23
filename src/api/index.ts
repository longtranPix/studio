// src/api/index.ts
import axios from 'axios';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';
import type { Order, OrderDetail, CreateOrderPayload } from '@/types/order';

const teableAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEABLE_AUTH_TOKEN}`,
    'Accept': 'application/json',
  },
});

const backendApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const viettelApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_VIETTEL_INVOICE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic MDEwMDEwOTEwNi01MDc6MndzeENERSM='
    }
});

// Auth API
export const signInUser = async (credentials: LoginFormValues): Promise<UserRecord> => {
  const { data } = await backendApi.post('/signin', credentials);
  if (!data.record || data.record.length === 0) {
    throw new Error('Đăng nhập thất bại. Không tìm thấy thông tin người dùng.');
  }
  return data.record[0];
};

export const signUpUser = async (userData: RegisterFormValues) => {
  const { data } = await backendApi.post('/signup', userData);
  return data;
};

export const checkUsernameExists = async (username: string) => {
    const { data } = await axios.get(process.env.NEXT_PUBLIC_TEABLE_USER_TABLE_API_URL!, {
        params: {
          fieldKeyType: 'dbFieldName',
          filter: JSON.stringify({
            conjunction: 'and',
            filterSet: [{ fieldId: 'username', operator: 'is', value: username }],
          }),
        },
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEABLE_AUTH_TOKEN}`,
          'Accept': 'application/json',
        },
      });
    return data.records && data.records.length > 0;
}

// Order API
export const fetchOrders = async ({ pageParam = null, tableId }: { pageParam: string | null, tableId: string }): Promise<{ records: Order[], offset: string | null }> => {
  const params = new URLSearchParams({ fieldKeyType: 'dbFieldName', take: '10' });
  if (pageParam) {
    params.append('offset', pageParam);
  }
  const { data } = await teableAxios.get(`/${tableId}/record`, { params });
  return { records: data.records || [], offset: data.offset || null };
};

export const fetchOrderDetails = async ({ orderId, tableId }: { orderId: string, tableId: string }): Promise<OrderDetail[]> => {
  const filter = { conjunction: "and", filterSet: [{ fieldId: "Don_Hang", operator: "is", value: orderId }] };
  const { data } = await teableAxios.get(`/${tableId}/record`, {
    params: { fieldKeyType: 'dbFieldName', filter: JSON.stringify(filter) },
  });
  return data.records || [];
};

export const createOrder = async (payload: CreateOrderPayload): Promise<string> => {
    const { data } = await backendApi.post('/create-order', payload);
    if (!data.recordId) throw new Error("Không thể tạo đơn hàng.");
    return data.recordId;
}

export const updateOrderRecord = async ({ orderId, tableId, payload }: { orderId: string, tableId: string, payload: any }) => {
    const { data } = await teableAxios.patch(`/${tableId}/record/${orderId}`, { fields: payload });
    return data;
}

// Invoice API
export const createViettelInvoice = async ({ username, payload }: { username: string, payload: any }): Promise<{invoiceNo: string}> => {
    const { data } = await viettelApi.post(`/${username}`, payload);
    if (!data || !data.invoiceNo) throw new Error("Phản hồi không chứa mã hoá đơn.");
    return data;
}

// Transcription API
export const transcribeAudio = async (formData: FormData) => {
    const { data } = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}
