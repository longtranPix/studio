

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
  customer_name?: string;
  extracted: ExtractedItem[] | null;
}

export interface OrderDetailItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  vat_rate: number;
}

export interface CreateOrderPayload {
  order_code: string;
  customer_name?: string;
  payment_method: string;
  order_details: OrderDetailItem[];
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
    order_code: string;
    customer_name?: string;
    invoice_state: boolean;
    total_temp: number;
    total_vat_price: number;
    total_with_tax: number;
    invoice_code?: string;
    invoice_file?: InvoiceFile[];
    detail_orders: string[];
    created_time: string;
    payment_method: "Chuyển khoản" | "Tiền mặt";
    status: "Đã thanh toán" | "Chưa thanh toán";
  };
  createdTime: string;
}

export interface OrderDetail {
  id: string;
  fields: {
    order_detail_code: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    vat_rate: number;
    temp_total: number;
    total: number;
    vat_price: number;
    order: string;
  };
}

// Teable API Response Types
export interface TeableInvoiceDetail {
  id: string;
  title: string;
}

export interface TeableOrderRecord {
  fields: {
    order_code: string;
    customer_name?: string;
    invoice_state: boolean;
    total_temp: number;
    total_vat_price: number;
    total_with_tax: number;
    invoice_code?: string;
    invoice_file?: InvoiceFile[];
    detail_orders: string[];
    created_time: string;
    payment_method: "Chuyển khoản" | "Tiền mặt";
    status: "Đã thanh toán" | "Chưa thanh toán";
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
