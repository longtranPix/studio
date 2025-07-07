

export interface ExtractedItem {
  ten_hang_hoa: string;
  don_vi_tinh: string | null;
  so_luong: number | null;
  don_gia: number | null;
  vat: number | null;
}

export interface TranscriptionResponse {
  language: string;
  transcription: string;
  customer_name: string;
  extracted: ExtractedItem[] | null;
}


export interface InvoiceFile {
  id: string;
  name: string;
  path: string;
  size: number;
  token: string;
  mimetype: string;
  presignedUrl: string;
}

export interface Order {
  id: string;
  fields: {
    order_number: number | string | null;
    customer_name: string;
    total_temp: number;
    total_vat: number;
    total_after_vat: number;
    invoice_state?: boolean;
    invoice_file?: InvoiceFile[];
    payment_method?: string;
  };
  createdTime: string;
}

export interface OrderDetail {
  id: string;
  fields: {
    product_name: string;
    unit_name: string;
    unit_price: number;
    quantity: number;
    vat: number;
    temp_total: number;
    final_total: number;
  };
}

// Teable API Response Types
export interface TeableInvoiceDetail {
  id: string;
  title: string;
}

export interface TeableOrderRecord {
  fields: {
    invoice_details: TeableInvoiceDetail[];
    customer_name: string;
    invoice_state: boolean;
    total_temp: number;
    total_vat: number;
    total_after_vat: number;
    order_number: number;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  createdBy: string;
}

export interface TeableCreateOrderResponse {
  status: string;
  order: {
    records: TeableOrderRecord[];
  };
  total_temp: number;
  total_vat: number;
  total_after_vat: number;
  invoice_state: boolean;
}

// Invoice API Types
export interface InvoiceGeneralInfo {
  currencyCode: string;
  adjustmentType: string;
  paymentStatus: boolean;
  cusGetInvoiceRight: boolean;
}

export interface InvoiceBuyerInfo {
  buyerName: string;
}

export interface InvoicePayment {
  paymentMethodName: string;
}

export interface InvoiceTaxBreakdown {
  taxPercentage: number;
}

export interface InvoiceItemInfo {
  lineNumber: number;
  itemName: string;
  unitName: string;
  unitPrice: number;
  quantity: number;
  selection: number;
  itemTotalAmountWithoutTax: number;
  taxPercentage: number;
  taxAmount: number;
}

export interface InvoicePayload {
  generalInvoiceInfo: InvoiceGeneralInfo;
  buyerInfo: InvoiceBuyerInfo;
  payments: InvoicePayment[];
  taxBreakdowns: InvoiceTaxBreakdown[];
  itemInfo: InvoiceItemInfo[];
}

export interface CreateInvoiceRequest {
  username: string;
  order_table_id: string;
  record_order_id: string;
  invoice_payload: InvoicePayload;
  field_attachment_id: string;
}

export interface CreateInvoiceResponse {
  detail: string;
  invoice_no: string;
  file_name: string;
}

// Enhanced response types for hooks
export interface InvoiceCreationResult {
  invoiceNo: string;
  detail: string;
  fileName: string;
}

export interface SaveAndInvoiceResult extends InvoiceCreationResult {
  recordId: string;
}

// Product Creation Types
export interface UnitConversion {
  name_unit: string;
  conversion_factor: number;
  unit_default: string;
  price: number;
  vat: number | null;
}

export interface ProductData {
  product_name: string;
  unit_conversions: UnitConversion[];
}

export interface CreateProductPayload {
  product_name: string;
  unit_conversions: UnitConversion[];
}

// Combined AI Response Type
export type ProcessedAudioResponse = {
  intent: 'create_invoice' | 'create_product' | 'unclear';
  transcription: string;
  invoice_data: TranscriptionResponse | null;
  product_data: ProductData | null;
}


// V2 Order Creation Types (New)
export interface UnitConversionLink {
    id: string;
    title: string;
}

export interface UnitConversionRecord {
    id: string;
    name: string; // The primary field from Teable, e.g., "Chai"
    fields: {
      name_unit: string;
      price: number;
      vat_rate: number | null; // Corrected field name from Teable
      conversion_factor: number;
      unit_default: string;
    }
}
  
export interface ProductRecord {
    id: string;
    name: string;
    fields: {
      product_name: string;
      unit_conversions: UnitConversionRecord[];
    };
}
  
export interface CustomerRecord {
    id: string;
    fields: {
      fullname: string;
      phone_number: string;
    };
}

export interface CreateCustomerPayload {
    fullname: string;
    phone_number: string;
    table_customer_id: string;
}

export interface CreateOrderDetailAPIPayload {
    product_id: string;
    unit_conversions_id: string;
    unit_price: number;
    quantity: number;
    vat: number;
}
  
export interface CreateOrderAPIPayload {
    customer_id: string;
    order_details: CreateOrderDetailAPIPayload[];
    delivery_type: string;
    notes?: string;
    order_table_id: string; 
    detail_table_id: string; 
}

// Represents the state of a single item line in the OrderForm
export interface EditableOrderItem {
    key: string; // for react list key
    // AI data
    initial_product_name: string;
    initial_quantity: number | null;
    initial_unit_price: number | null;
    initial_vat: number | null;
    don_vi_tinh: string | null;
  
    // Product Search State
    product_search_term: string;
    product_search_results: ProductRecord[];
    is_searching_product: boolean;
    is_product_search_open: boolean;
    
    // Selected Product Data
    product_id: string | null;
    product_name: string;
    
    // Unit Selection State
    available_units: UnitConversionRecord[];
    unit_conversion_id: string | null;
  
    // Final values
    unit_price: number | null;
    quantity: number | null;
    vat: number | null;
}
