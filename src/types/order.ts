

export interface ExtractedItem {
  ten_hang_hoa: string;
  so_luong: number | null;
  don_gia: number | null;
  vat: number | null;
}

export interface TranscriptionResponse {
  language: string;
  transcription: string;
  customer_name: string | null;
  extracted: ExtractedItem[] | null;
}

export interface OrderDetailItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  vat: number;
  temp_total: number;
  final_total: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  order_details: OrderDetailItem[];
  order_table_id: string;
  detail_table_id: string;
  invoice_state?: boolean;
  total_temp: number;
  total_vat: number;
  total_after_vat: number;
  payment_method?: string;
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
