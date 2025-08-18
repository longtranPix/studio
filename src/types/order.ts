// src/types/order.ts
export interface ExtractedItem {
  ten_hang_hoa: string;
  don_vi_tinh: string | null;
  so_luong: number | null;
  don_gia: number | null;
  vat: number;
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
    product_name_lookup: string[];
    unit_conversions: { id: string; title: string };
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
  price: number | null;
  vat: number;
}

export interface AttributeData {
  type: string;
  value: string;
}

export interface ProductData {
  product_name: string;
  brand_name: string | null;
  unit_conversions: UnitConversion[];
  catalog: string | null;
  attributes: AttributeData[] | null;
}

export interface CreateProductPayload {
  product_name: string;
  brand_id: string;
  attributes_ids: string[];
  catalogs_ids: string[];
  unit_conversions: UnitConversion[];
}

export interface NewlyCreatedUnitConversion {
  unit_conversion_id: string;
  name_unit: string;
  conversion_factor: number;
  unit_default: string;
  price: number;
  vat: number;
}

export interface NewlyCreatedProductData {
  product_id: string;
  product_name: string;
  unit_conversions: NewlyCreatedUnitConversion[];
  brand_id: string;
  attributes_ids: string[];
  unit_default: string;
  price: number;
  vat_rate: number;
}

export interface CreateProductResponse {
  status: string;
  detail: string;
  product_id: string;
  product_data: NewlyCreatedProductData;
}


// --- Import Slip Types ---
export interface ImportSlipData {
    supplier_name: string;
    extracted: ExtractedItem[] | null;
}

export interface SupplierRecord {
    id: string;
    fields: {
      supplier_name: string;
      address?: string;
    };
}

export interface CreateSupplierPayload {
    supplier_name: string;
    address: string;
}
  
export interface TeableCreateSupplierResponse {
    records: SupplierRecord[];
}

export interface CreateImportSlipDetailPayload {
    product_id: string;
    unit_conversions_id: string | null;
    quantity: number;
    unit_price: number;
    vat: number;
}

export interface CreateImportSlipPayload {
    supplier_id: string;
    import_type: string;
    import_slip_details: CreateImportSlipDetailPayload[];
}

export interface CreateImportSlipResponse {
    status: string;
    detail: string;
    import_slip_id: string;
    import_slip_code: string;
    import_slip_details_ids: string[];
    total_items: number;
    total_amount: number;
}


// Combined AI Response Type
export type ProcessedAudioResponse = {
  intent: 'create_invoice' | 'create_product' | 'create_import_slip' | 'unclear';
  transcription: string;
  invoice_data: TranscriptionResponse | null;
  product_data: ProductData | null;
  import_slip_data: ImportSlipData | null;
}

export type ProcessedImageOutput = {
  intent: 'create_invoice' | 'create_product' | 'create_import_slip' | 'unclear';
  transcription: string;
  invoice_data: TranscriptionResponse | null;
  product_data: ProductData | null;
  import_slip_data: ImportSlipData | null;
};


// V2 Order Creation Types
export interface UnitConversionLink {
    id: string;
    title: string;
}

export interface UnitConversionProductLink {
  id: string;
  title: string;
}

export interface UnitConversionRecord {
    id: string;
    name: string; 
    fields: {
      name_unit: string;
      price: number;
      vat_rate: number; 
      conversion_factor: number;
      unit_default: string;
      San_Pham?: UnitConversionProductLink[];
    }
}
  
export interface ProductRecord {
    id: string;
    name: string;
    fields: {
      product_name: string;
      unit_conversions?: UnitConversionLink[];
      inventory?: number;
      unit_default?: string;
      price?: number | null;
      vat_rate?: number | null;
    };
}
  
export interface CustomerRecord {
    id:string;
    name: string;
    fields: {
      fullname: string;
      phone_number: string;
    };
}

export interface CreateCustomerPayload {
    fullname: string;
    phone_number: string;
}

export interface TeableCreateCustomerResponse {
  records: CustomerRecord[];
}


export interface CreateOrderDetailAPIPayload {
    product_id: string;
    unit_conversions_id: string | null;
    unit_price: number;
    quantity: number;
    vat: number;
}
  
export interface CreateOrderAPIPayload {
    customer_id: string;
    order_details: CreateOrderDetailAPIPayload[];
    delivery_type: string;
}

// Represents the state of a single item line in the OrderForm
export interface EditableOrderItem {
    key: string; // for react list key
    // AI data
    initial_product_name: string;
    initial_quantity: number | null;
    initial_unit_price: number | null;
    initial_vat: number;
    don_vi_tinh: string | null;
  
    // Product Search State
    product_search_term: string;
    
    // Selected Product Data
    product_id: string | null;
    product_name: string;
    inventory?: number; // Add inventory to the item state

    // Unit Selection State
    available_units: UnitConversionRecord[];
    unit_conversion_id: string | null;
    is_fetching_units?: boolean;
  
    // Final values
    unit_price: number | null;
    quantity: number | null;
    vat: number;
}

// View API Types
export interface ViewRecord {
  id: string;
  name: string;
}

// Plan Status Types
export interface PlanStatusData {
  fields: {
    Nhan: number;
    So: { id: string; title: string };
    started_time: string;
    cycle: number;
    time_expired: string;
    Ngay: string;
    status: string;
    credit_value: number;
    Tai_khoan: { id: string; title: string };
    name_plan: string;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface PlanStatusResponse {
  status: string;
  message: string;
  data: PlanStatusData;
}

// Brand Types
export interface BrandRecord {
    id: string;
    fields: {
      name: string;
    };
}

export interface CreateBrandPayload {
    name: string;
}

export interface TeableCreateBrandResponse {
    records: BrandRecord[];
}

// Profile API Types
export interface ProfileData {
  username: string;
  business_name: string;
  current_plan_name: string;
  last_login: string;
  time_expired: string;
}

export interface ProfileApiResponse {
  status: string;
  message: string;
  data: ProfileData;
}

export interface UpdateProfilePayload {
  business_name: string;
}


// Attribute and Catalog Types
export interface CatalogRecord {
    id: string;
    fields: {
        name: string;
    };
}

export interface CreateCatalogPayload {
    name: string;
}

export interface TeableCreateCatalogResponse {
    records: CatalogRecord[];
}

export interface AttributeTypeRecord {
    id: string;
    fields: {
        name: string;
        catalogs?: { id: string; title: string }[];
    };
}

export interface CreateAttributeTypePayload {
    name: string;
    catalogs: string[];
}

export interface UpdateAttributeTypePayload {
    catalogs: string[];
}

export interface TeableCreateAttributeTypeResponse {
    records: AttributeTypeRecord[];
}

export interface AttributeRecord {
    id: string;
    fields: {
        value_attribute: string;
        attribute_type?: { id: string; title: string }[];
    };
}

export interface CreateAttributePayload {
    value_attribute: string;
    attribute_type: { id: string };
}

export interface TeableCreateAttributeResponse {
    records: AttributeRecord[];
}


export interface EditableAttributeItem {
  key: string;
  typeSearchTerm: string;
  valueSearchTerm: string;
  typeId: string | null;
  typeName: string;
  valueId: string | null;
}
