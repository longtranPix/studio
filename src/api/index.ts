// src/api/index.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import type { LoginFormValues, RegisterFormValues, UserRecord } from '@/components/auth/auth-form';
import type { Order, OrderDetail, CreateOrderAPIPayload, TeableCreateOrderResponse, CreateInvoiceRequest, CreateInvoiceResponse, CreateProductPayload, ProductRecord, CustomerRecord, CreateCustomerPayload, UnitConversionRecord, TeableCreateCustomerResponse, ViewRecord } from '@/types/order';

const teableAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL,
  headers: {
    'Accept': 'application/json',
  },
});

teableAxios.interceptors.request.use(
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
export const signInUser = async (credentials: LoginFormValues): Promise<{record: UserRecord[], access_token: string}> => {
  const { data } = await backendApi.post('/signin', credentials);
  return data;
};

export const signUpUser = async (userData: Omit<RegisterFormValues, 'confirmPassword'>) => {
  const { data } = await backendApi.post('/signup', userData);
  return data;
};

export const checkUsernameExists = async (username: string) => {
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/tblv9Ou1thzbETynKn1/record`);
    const params = {
        fieldKeyType: 'dbFieldName',
        filter: JSON.stringify({
            conjunction: 'and',
            filterSet: [{ fieldId: 'username', operator: 'is', value: username }],
        }),
    };
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    
    const { data } = await teableAxios.get(url.toString());
    return data.records && data.records.length > 0;
}

// View API
export const fetchViewsForTable = async (tableId: string): Promise<ViewRecord[]> => {
  const { data } = await teableAxios.get(`/${tableId}/view`);
  return data;
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
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/${tableId}/record`);
    const params = new URLSearchParams({
        fieldKeyType: 'dbFieldName',
        filter: JSON.stringify({ conjunction: "and", filterSet: [{ fieldId: "Don_Hang", operator: "is", value: orderId }] })
    });
    const { data } = await teableAxios.get(`${url.pathname}?${params.toString()}`);
    return data.records || [];
};

export const createOrder = async (payload: CreateOrderAPIPayload): Promise<TeableCreateOrderResponse> => {
    const { data } = await backendApi.post('/create-order', payload);
    return data;
}

// Product API
export const fetchProducts = async ({ tableId, viewId }: { tableId: string, viewId: string }): Promise<ProductRecord[]> => {
    const params = { fieldKeyType: 'dbFieldName', viewId };
    const { data } = await teableAxios.get(`/${tableId}/record`, { params });
    return data.records || [];
};

export const createProductWithUnits = async (payload: CreateProductPayload) => {
    const { data } = await backendApi.post('/products/create-product-with-units', payload);
    return data;
}

export const searchProducts = async ({ query, tableId }: { query: string; tableId: string }): Promise<ProductRecord[]> => {
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/${tableId}/record`);
    const params = new URLSearchParams({
        fieldKeyType: 'dbFieldName',
        filter: JSON.stringify({
            conjunction: 'and',
            filterSet: [{ fieldId: 'product_name', operator: 'contains', value: query }],
        }),
    });
    
    const { data } = await teableAxios.get(`${url.pathname}?${params.toString()}`);
    return data.records || [];
};

export const fetchUnitConversionsByProductId = async ({ productId, tableId }: { productId: string; tableId: string }): Promise<UnitConversionRecord[]> => {
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/${tableId}/record`);
    const params = new URLSearchParams({
      fieldKeyType: 'dbFieldName',
      filter: JSON.stringify({
        conjunction: 'and',
        filterSet: [{ fieldId: 'San_Pham', operator: 'isExactly', value: [productId] }],
      }),
    });

    const { data } = await teableAxios.get(`${url.pathname}?${params.toString()}`);
    return data.records || [];
};

export const fetchAllUnitConversionsByProductIds = async ({ productIds, tableId }: { productIds: string[]; tableId: string }): Promise<UnitConversionRecord[]> => {
    if (productIds.length === 0) return [];
    
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/${tableId}/record`);
    const params = new URLSearchParams({
        fieldKeyType: 'dbFieldName',
        filter: JSON.stringify({
            conjunction: 'or',
            filterSet: productIds.map(id => ({ fieldId: 'San_Pham', operator: 'isExactly', value: [id] })),
        }),
    });
    
    const { data } = await teableAxios.get(`${url.pathname}?${params.toString()}`);
    return data.records || [];
};


// Customer API
export const searchCustomers = async ({ query, tableId }: { query: string; tableId: string }): Promise<CustomerRecord[]> => {
    const url = new URL(`${process.env.NEXT_PUBLIC_TEABLE_BASE_API_URL}/${tableId}/record`);
    const params = new URLSearchParams({
        fieldKeyType: 'dbFieldName',
        filter: JSON.stringify({
            conjunction: 'and',
            filterSet: [{ fieldId: 'fullname', operator: 'contains', value: query }],
        }),
    });

    const { data } = await teableAxios.get(`${url.pathname}?${params.toString()}`);
    return data.records || [];
};

export const createCustomer = async ({ payload, tableId }: { payload: CreateCustomerPayload; tableId: string }): Promise<TeableCreateCustomerResponse> => {
    const requestBody = {
        fieldKeyType: 'dbFieldName',
        records: [
            {
                fields: payload,
            },
        ],
    };
    const { data } = await teableAxios.post(`/${tableId}/record`, requestBody);
    return data;
};


// Invoice API
export const createViettelInvoice = async (request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
    const { data } = await backendApi.post('/generate-invoice', request);
    return data;
}

// Profile API
export const getProfileByUsername = async (username: string, productViewId: string) => {
    const params = {
        fieldKeyType: "dbFieldName",
        viewId: productViewId,
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
