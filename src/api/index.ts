
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

const invoiceApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_INVOICE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Auth API
export const signInUser = async (credentials: LoginFormValues): Promise<{record: UserRecord[]}> => {
  const { data } = await backendApi.post('/signin', credentials);
  return data;
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

export const createOrder = async (payload: CreateOrderPayload): Promise<{recordId: string}> => {
    const { data } = await backendApi.post('/create-order', payload);
    return data;
}

export const updateOrderRecord = async ({ orderId, tableId, payload }: { orderId: string, tableId: string, payload: any }) => {
    const { data } = await teableAxios.patch(`/${tableId}/record/${orderId}`, { fields: payload });
    return data;
}

// Invoice API
export const createViettelInvoice = async ({ username, order_table_id, record_order_id, invoice_payload }: { username: string, order_table_id: string, record_order_id: string, invoice_payload: any }): Promise<{invoiceNo: string}> => {
    const payload = {
        username,
        order_table_id,
        record_order_id,
        invoice_payload,
    };
    const { data } = await invoiceApi.post('/generate-invoice', payload);
    return data;
}

// Transcription API
export const transcribeAudio = async (formData: FormData) => {
    const { data } = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}
