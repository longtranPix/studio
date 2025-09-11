
// src/api/index.ts
import axios from 'axios';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';
import type { Order, OrderDetail, CreateOrderPayload, TeableCreateOrderResponse, CreateInvoiceRequest, CreateInvoiceResponse } from '@/types/order';
import { useAuthStore } from '@/store/auth-store';
import { BankInfo } from '@/types/profile';

// Teable API client with interceptor
const teableApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL,
  headers: {
    'Accept': 'application/json',
  },
});

teableApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const backendApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

backendApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !config.url?.includes('signin') && !config.url?.includes('signup')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const invoiceApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_INVOICE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Auth API
export const signInUser = async (credentials: LoginFormValues): Promise<{record: UserRecord[]}> => {
  const { data } = await backendApi.post('/auth/signin', credentials);
  return data;
};

export const signUpUser = async (userData: Omit<RegisterFormValues, 'confirmPassword'>) => {
  const { data } = await backendApi.post('/signup', userData);
  return data;
};

export const checkUsernameExists = async (username: string) => {
  // This functionality might need to be implemented in the backend API
  // For now, we'll return false to allow registration
  return false;
}

// Order API - Using Teable API with interceptor
export const fetchOrders = async ({ tableId, page = 1, invoiceStateFilter }: { tableId: string, page?: number, invoiceStateFilter: boolean | null }): Promise<Order[]> => {
  const take = 10;
  const skip = (page - 1) * take;

  const filter: { conjunction: "and", filterSet: any[] } = { conjunction: "and", filterSet: [] };
  if (invoiceStateFilter !== null) {
      filter.filterSet.push({ fieldId: "invoice_state", operator: "is", value: invoiceStateFilter });
  }

  const params: Record<string, string> = {
      fieldKeyType: 'dbFieldName',
      skip: String(skip),
      take: String(take),
      orderBy: JSON.stringify([{ "fieldId": "sort", "order": "desc" }]),
  };

  if (filter.filterSet.length > 0) {
      params.filter = JSON.stringify(filter);
  }

  const { data } = await teableApi.get(`/${tableId}/record`, { params });
  return data.records || [];
};

export const fetchTotalOrders = async (tableId: string, invoiceStateFilter: boolean | null): Promise<number> => {
  const params: Record<string, string> = {};
  if (invoiceStateFilter !== null) {
      const filter = {
          conjunction: "and",
          filterSet: [{ fieldId: "invoice_state", operator: "is", value: invoiceStateFilter }]
      };
      params.filter = JSON.stringify(filter);
  }
  const { data } = await teableApi.get(`/${tableId}/aggregation/row-count`, { params });
  return data.rowCount || 0;
}

export const fetchOrderDetails = async ({ orderId, tableId }: { orderId: string, tableId: string }): Promise<OrderDetail[]> => {
  const filter = { conjunction: "and", filterSet: [{ fieldId: "order", operator: "is", value: orderId }] };
  const { data } = await teableApi.get(`/${tableId}/record`, {
    params: { fieldKeyType: 'dbFieldName', filter: JSON.stringify(filter) },
  });
  return data.records || [];
};

export const createOrder = async (payload: CreateOrderPayload): Promise<TeableCreateOrderResponse> => {
    const { data } = await backendApi.post('/orders/create-order', payload);
    return data;
}

export const updateOrderRecord = async ({ orderId, tableId, payload }: { orderId: string, tableId: string, payload: any }) => {
    const { data } = await teableApi.patch(`/${tableId}/record/${orderId}`, { fields: payload });
    return data;
}

// Invoice API
export const createViettelInvoice = async (request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
    const { data } = await backendApi.post('/generate-invoice', request);
    return data;
}

// Profile API
export const getCurrentUser = async () => {
    const { data } = await backendApi.get('/auth/me');
    return data;
};

export const updateUserProfile = async (profileData: {
    business_name?: string;
    tax_code?: string;
    bank_name?: string;
    bank_number?: string;
    account_name?: string;
}) => {
    const { data } = await backendApi.patch('/user/update-profile', profileData);
    return data;
};

// Plan Status API
export const getPlanStatus = async () => {
    const { data } = await backendApi.get('/plan-status/get-status-plan');
    return data;
};

// Transcription API
export const transcribeAudio = async (formData: FormData) => {
    const { data } = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export const fetchBanks = async (): Promise<BankInfo[]> => {
  const { data } = await axios.get('https://api.vietqr.io/v2/banks');
  return data.data || [];
}
