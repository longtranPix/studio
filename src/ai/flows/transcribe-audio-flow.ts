
'use server';

/**
 * @fileOverview A Genkit flow for processing user voice commands.
 * It can handle both invoice creation and product creation.
 *
 * - processAudio - A function that handles voice command processing.
 * - ProcessAudioInput - The input type for aistore.
 * - ProcessedAudioOutput - The return type for aistore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractedItem, TranscriptionResponse, ImportSlipData } from '@/types/order';

// --- SCHEMAS FOR INVOICE CREATION (Based on existing structure) ---
const ExtractedItemSchema: z.ZodType<ExtractedItem> = z.object({
  ten_hang_hoa: z.string().describe('CRITICAL! Extract the core product name, focusing on the BRAND or most UNIQUE identifier for searching. REMOVE generic prefixes (like "Mì Tôm", "Nước ngọt"), quantities, units, and prices. For example, for "5 lốc bia Tiger", extract "Tiger". For "Mì Tôm Hảo Hảo", extract "Hảo Hảo". For "Sting", extract "Sting". This text MUST be optimized for searching.'),
  don_vi_tinh: z.string().nullable().describe('The single unit name of the item (e.g., "cái", "chiếc", "hộp", "lốc", "thùng"). Default to "cái" if not mentioned.'),
  so_luong: z.number().nullable().describe('Số lượng của mặt hàng.'),
  don_gia: z.number().nullable().describe('Đơn giá của mặt hàng. IMPORTANT: For invoice creation, the price is defined in the system. Always set this field to null.'),
  vat: z.number().default(0).describe('Phần trăm thuế GTGT (VAT). Default to 0 if not mentioned.'),
});

const InvoiceDataSchema: z.ZodType<TranscriptionResponse> = z.object({
    language: z.string().describe('The detected language of the audio (e.g., "vi-VN").'),
    transcription: z.string().describe('The full transcribed text from the audio.'),
    customer_name: z.string().describe('The name of the customer. Extract ONLY the name, without any titles or prefixes like "Anh" or "Chị" (e.g., for "Anh Trần Minh Long", extract "Trần Minh Long"). Set to an empty string ("") if not mentioned.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the transcription.'),
});

// --- SCHEMAS FOR PRODUCT CREATION (NEW) ---
const UnitConversionSchema = z.object({
    name_unit: z.string().describe("Tên của đơn vị tính cơ bản (ví dụ: 'Chai', 'Lốc', 'Thùng'). CRITICAL: Extract only the base unit name and CAPITALIZE the first letter. For 'Lốc 6 chai', extract 'Lốc'. For 'thùng 12 lốc', extract 'Thùng'."),
    conversion_factor: z.number().describe("Hệ số quy đổi ra đơn vị nhỏ nhất (ví dụ: lốc 6 chai = 6, thùng 12 lốc = 72 nếu 1 lốc 6 chai)."),
    unit_default: z.string().describe("Đơn vị nhỏ nhất làm cơ sở quy đổi (ví dụ: 'Chai')."),
    price: z.number().describe("Giá bán của đơn vị này. IMPORTANT VIETNAMESE CURRENCY RULE: If the user says a number like '140' or '25', it implies '140,000' or '25,000'. You MUST multiply these abbreviated numbers by 1000. For '25 triệu', you must extract 25000000. Example: 'giá 140' -> 140000."),
    vat: z.number().default(0).describe("Phần trăm thuế GTGT (VAT). Nếu không có thì để 0.")
});

const CatalogSchema = z.object({
    type: z.string().describe("The type or category of the attribute (e.g., 'Màu sắc', 'Kích cỡ', 'Kiểu dáng'). Extract this from phrases like 'màu đen', 'size L', 'kiểu cổ cao'."),
    value: z.string().describe("The specific value of the attribute (e.g., 'Đen', 'L', 'Cổ cao'). If the value is not mentioned for an inferred attribute, this MUST be an empty string, not null.")
});

const ProductDataSchema = z.object({
    product_name: z.string().describe("Tên hàng hóa, càng chi tiết càng tốt (bao gồm thể tích nếu có)."),
    brand_name: z.string().nullable().describe('The brand of the product (e.g., "Sting", "Tiger", "Hảo Hảo"). Extract a concise brand name suitable for searching. Set to null if not mentioned.'),
    unit_conversions: z.array(UnitConversionSchema).describe("Danh sách các đơn vị quy đổi."),
    catalog: z.string().nullable().describe("The main category or catalog of the product (e.g., 'Bóng đèn', 'Giày', 'Áo sơ mi')."),
    attributes: z.array(CatalogSchema).nullable().describe("A list of product attributes, like color, size, or style. For example, from 'giày Nike màu đen size 42', extract two attributes: {type: 'Màu sắc', value: 'Đen'} and {type: 'Kích cỡ', value: '42'}.")
});


// --- SCHEMAS FOR IMPORT SLIP CREATION (NEW) ---
const ImportSlipDataSchema: z.ZodType<ImportSlipData> = z.object({
    supplier_name: z.string().describe('The name of the supplier. Extract a concise name suitable for searching (e.g., for "Nhập kho từ nhà cung cấp ABC", extract "ABC"). Set to an empty string ("") if not mentioned.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the transcription for the import slip.'),
});


// --- COMBINED FLOW SCHEMAS ---
const ProcessAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessAudioInput = z.infer<typeof ProcessAudioInputSchema>;

const ProcessedAudioOutputSchema = z.object({
    intent: z.enum(['create_invoice', 'create_product', 'create_import_slip', 'unclear']).describe('The user\'s intent. Use "create_product" if the user says "Tạo hàng hóa". Use "create_import_slip" if the user starts with "Nhập kho" or mentions "Nhà cung cấp". Use "create_invoice" for invoicing. Use "unclear" otherwise.'),
    transcription: z.string().describe('The full transcribed text from the audio.'),
    invoice_data: InvoiceDataSchema.nullable().describe('The extracted invoice data if intent is "create_invoice".'),
    product_data: ProductDataSchema.nullable().describe('The extracted product data if intent is "create_product".'),
    import_slip_data: ImportSlipDataSchema.nullable().describe('The extracted import slip data if intent is "create_import_slip".')
});
export type ProcessedAudioOutput = z.infer<typeof ProcessedAudioOutputSchema>;


export async function processAudio(input: ProcessAudioInput): Promise<ProcessedAudioOutput> {
  return processAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processAudioPrompt',
  input: {schema: ProcessAudioInputSchema},
  output: {schema: ProcessedAudioOutputSchema},
  prompt: `You are an intelligent assistant for an invoicing and inventory app in Vietnamese. Your primary job is to understand user's voice commands from an audio file and extract structured data.

First, determine the user's intent from the transcription.
- If the user starts with "Nhập kho" or mentions "nhà cung cấp", the intent is 'create_import_slip'.
- If the user starts with "Tạo hàng hóa", the intent is 'create_product'.
- For all other cases related to listing items, prices, quantities for a customer, the intent is 'create_invoice'.
- If the audio is unclear or doesn't match these patterns, the intent is 'unclear'.

Based on the intent, perform one of the following tasks:

### Task 1: Create Invoice (intent: 'create_invoice')
Transcribe the audio and extract invoice information.
- 'customer_name': The customer's name. Crucially, extract ONLY the name, removing any titles or prefixes like "Anh", "Chị", "Cô", "Chú" (e.g., for "Anh Trần Minh Long", extract "Trần Minh Long"). If no name is mentioned, set to an empty string ("").
- 'extracted': A list of items. For each item:
    - 'ten_hang_hoa': CRITICAL! Extract the core product name, focusing on the BRAND or most UNIQUE identifier for searching. REMOVE generic prefixes (like "Mì Tôm", "Nước ngọt"), quantities, units, and prices. For example, for "5 lốc bia Tiger", extract "Tiger". For "Mì Tôm Hảo Hảo", extract "Hảo Hảo". For "Sting", extract "Sting". This text MUST be optimized for searching.
    - 'don_vi_tinh': Extract the single unit name (e.g., "chai", "lốc", "thùng"). Default to "cái" if not specified.
    - 'don_gia': CRITICAL RULE! For creating an invoice, the price is already stored in the system. DO NOT extract a price from the user's speech. You MUST ALWAYS set this field to null.
    - 'vat': The VAT rate. If not mentioned, YOU MUST set this to 0.
    - Set missing numerical fields (quantity) to null.
- If no invoice info is found, 'extracted' should be an empty array.
- The full response for this intent MUST conform to the 'invoice_data' schema.

### Task 2: Create Product (intent: 'create_product')
If the audio starts with "Tạo hàng hóa", extract product information.
- 'product_name': The full, detailed name of the product.
- 'brand_name': Extract the brand (e.g., "Điện Quang", "Nike").
- 'catalog': The primary product category (e.g., "Bóng đèn", "Giày", "Áo sơ mi"). This is the most general classification.
- 'attributes': A list of attribute type-value pairs.
    - **CRITICAL RULE**: Use your extensive general knowledge about products to generate a comprehensive list of relevant attributes for the identified 'catalog'.
    - First, extract all attribute values the user explicitly mentions (e.g., for "Macbook Pro màu xám 16GB RAM", extract `value: "Xám"` for `type: "Màu sắc"` and `value: "16GB"` for `type: "RAM"`).
    - Second, for the same catalog, infer OTHER relevant attributes that a user would typically want to specify for that product type, but leave their 'value' as an EMPTY STRING ("") if the user did not mention them.
    - **Example Workflow**:
        1. User says: "Tạo hàng hóa Sách Đắc Nhân Tâm".
        2. You identify 'catalog' as "Sách".
        3. Based on your knowledge of books, you know relevant attributes are "Tác giả", "Nhà xuất bản", "Ngôn ngữ", "Năm xuất bản".
        4. You extract the value for "Tác giả" as "Dale Carnegie" (from your knowledge).
        5. You generate the following attributes list: `[{type: "Tác giả", value: "Dale Carnegie"}, {type: "Nhà xuất bản", value: ""}, {type: "Ngôn ngữ", value: ""}, {type: "Năm xuất bản", value: ""}]`.
    - **Formatting Examples (For guidance on structure, not an exhaustive list)**:
        - **Bóng đèn**: "Công suất", "Ánh sáng", "Loại đui".
        - **Giày**: "Màu sắc", "Kích cỡ", "Chất liệu", "Kiểu dáng".
        - **Laptop**: "Màu sắc", "CPU", "RAM", "Ổ cứng", "Kích thước màn hình".
        - **Sách**: "Tác giả", "Nhà xuất bản", "Ngôn ngữ".
- 'unit_conversions': A list of unit conversions for the product. Each unit includes:
  - 'name_unit': CRITICAL! Extract only the base unit name and you MUST CAPITALIZE THE FIRST LETTER. For example, from "Lốc 6 chai" you must extract "Lốc". From "thùng 12 lốc" you must extract "Thùng". From "chai", extract "Chai". The name must be simple, basic, and capitalized.
  - 'conversion_factor': The number of base units contained in this unit (e.g., pack of 6 bottles = 6, carton of 12 packs = 72 if each pack has 6 bottles).
  - 'unit_default': Always the smallest unit used as the conversion base (e.g., “Chai”).
  - 'price': The price of this unit. Follow the VIETNAMESE CURRENCY RULE: multiply abbreviated numbers by 1000. For '25 triệu', you MUST extract 25000000. Example: "giá 140" -> 140000.
  - 'vat': VAT rate if specified. If not mentioned, YOU MUST set this to 0.
- **NEW RULE**: If the user does NOT mention any unit information (e.g., "Tạo hàng hóa Pepsi giá 10 nghìn"), you MUST infer a logical default unit (e.g., "Chai" for Pepsi). You must create a single entry in 'unit_conversions' with this default unit, setting 'conversion_factor' to 1, 'unit_default' to the same unit name, and **you MUST apply the price mentioned in the command to this single unit.** If no price is mentioned, set 'price' to 0.
- The full response for this intent MUST conform to the 'product_data' schema.

### Task 3: Create Import Slip (intent: 'create_import_slip')
If the audio starts with "Nhập kho" or mentions "nhà cung cấp", extract import slip information.
- 'supplier_name': The supplier's name. Look for phrases like "từ nhà cung cấp X" or "của nhà cung cấp Y". Extract a concise, searchable name. For example, from "Nhập kho từ nhà cung cấp Nước Giải Khát Tân Hiệp Phát", extract "Tân Hiệp Phát". If no supplier name is mentioned, set to an empty string.
- 'extracted': A list of items to be imported, following the same structure as in 'create_invoice' (especially the 'ten_hang_hoa' extraction rule and the VIETNAMESE CURRENCY RULE for 'don_gia'). For this intent, the user WILL state the import price.
    - 'don_gia': IMPORTANT VIETNAMESE CURRENCY RULE! In Vietnam, prices are often abbreviated. If the user says a number like "140" or "25", they mean "140,000" or "25,000". You MUST multiply these numbers by 1000. If they say "25 triệu", you must extract 25000000. If they say the full amount ("một trăm bốn mươi nghìn") or a number that is already large, keep it as is. Example: "giá 140" -> 140000.
    - 'vat': The VAT rate for the imported item. If not mentioned, YOU MUST set this to 0.
- The full response for this intent MUST conform to the 'import_slip_data' schema.


### Final Output
Your final response MUST be a single JSON object matching the 'ProcessedAudioOutputSchema', containing the 'intent', 'transcription', and ONLY the relevant data object ('invoice_data', 'product_data', OR 'import_slip_data', the others must be null). Do not include comments or extra text — only return the JSON.

Audio: {{media url=audioDataUri}}`,
});

const processAudioFlow = ai.defineFlow(
  {
    name: 'processAudioFlow',
    inputSchema: ProcessAudioInputSchema,
    outputSchema: ProcessedAudioOutputSchema,
    config: {
      model: 'googleai/gemini-1.5-flash-latest'
    }
  },
  async input => {
    const {output} = await prompt(input);

    // Post-processing to ensure data consistency and prevent AI from returning multiple data objects
    if (output) {
        if (output.intent === 'create_invoice') {
            output.product_data = null;
            output.import_slip_data = null;
            if (!output.invoice_data) {
                output.invoice_data = { language: 'vi-VN', transcription: output.transcription, customer_name: '', extracted: [] };
            }
        } else if (output.intent === 'create_product') {
            output.invoice_data = null;
            output.import_slip_data = null;
            if (!output.product_data) {
                output.product_data = { product_name: '', brand_name: null, unit_conversions: [], catalog: null, attributes: null };
            }
        } else if (output.intent === 'create_import_slip') {
            output.invoice_data = null;
            output.product_data = null;
            if (!output.import_slip_data) {
                output.import_slip_data = { supplier_name: '', extracted: [] };
            }
        } else { // 'unclear'
            output.invoice_data = null;
            output.product_data = null;
            output.import_slip_data = null;
        }
    }
    return output!;
  }
);

    
