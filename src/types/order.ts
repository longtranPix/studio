export interface ExtractedItem {
  ten_hang_hoa: string;
  so_luong: number | null;
  don_gia: number | null;
  vat: number | null;
}

export interface TranscriptionResponse {
  language: string;
  transcription: string;
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
}

export interface Order {
  id: string;
  fields: {
    order_number: number | string | null;
    customer_name: string;
    total_temp: number;
    total_vat: number;
    total_after_vat: number;
    createdTime: string;
    invoice_state?: boolean;
  };
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
