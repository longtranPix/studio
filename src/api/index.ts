
// src/api/index.ts
import axios from 'axios';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';
import type { Order, OrderDetail, CreateOrderPayload, TeableCreateOrderResponse, CreateInvoiceRequest, CreateInvoiceResponse } from '@/types/order';

const teableAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEABLE_AUTH_TOKEN}`,
    'Accept': 'application/json',
  },
});

const backendApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
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
      orderBy: JSON.stringify([{ "fieldId": "order_number", "order": "desc" }]),
  };

  if (filter.filterSet.length > 0) {
      params.filter = JSON.stringify(filter);
  }

  const { data } = await teableAxios.get(`/${tableId}/record`, { params });
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
    const { data } = await teableAxios.get(`/${tableId}/aggregation/row-count`, { params });
    return data.rowCount || 0;
}

export const fetchOrderDetails = async ({ orderId, tableId }: { orderId: string, tableId: string }): Promise<OrderDetail[]> => {
  const filter = { conjunction: "and", filterSet: [{ fieldId: "Don_Hang", operator: "is", value: orderId }] };
  const { data } = await teableAxios.get(`/${tableId}/record`, {
    params: { fieldKeyType: 'dbFieldName', filter: JSON.stringify(filter) },
  });
  return data.records || [];
};

export const createOrder = async (payload: CreateOrderPayload): Promise<TeableCreateOrderResponse> => {
    const { data } = await backendApi.post('/create-order', payload);
    return data;
}

export const updateOrderRecord = async ({ orderId, tableId, payload }: { orderId: string, tableId: string, payload: any }) => {
    const { data } = await teableAxios.patch(`/${tableId}/record/${orderId}`, { fields: payload });
    return data;
}

// Invoice API
export const createViettelInvoice = async (request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
    const { data } = await backendApi.post('/generate-invoice', request);
    return data;
}

// Profile API
export const getProfileByUsername = async (username: string) => {
    const params = {
        fieldKeyType: "dbFieldName",
        viewId: "viw77TgwzwefvLvrnqL",
        filter: JSON.stringify({
            "conjunction": "and",
            "filterSet": [{"fieldId": "username", "operator": "is", "value": username}]
        })
    };

    const { data } = await teableAxios.get('/tblv9Ou1thzbETynKn1/record', { params });
    return data;
};

// Transcription API
export const transcribeAudio = async (formData: FormData) => {
    const { data } = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}
