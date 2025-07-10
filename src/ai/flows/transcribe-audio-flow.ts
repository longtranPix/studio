
'use server';

/**
 * @fileOverview A Genkit flow for processing user voice commands.
 * It can handle both invoice creation and product creation.
 *
 * - processAudio - A function that handles voice command processing.
 * - ProcessAudioInput - The input type for the processAudio function.
 * - ProcessedAudioOutput - The return type for the processAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractedItem, TranscriptionResponse, ImportSlipData } from '@/types/order';

// --- SCHEMAS FOR INVOICE CREATION (Based on existing structure) ---
const ExtractedItemSchema: z.ZodType<ExtractedItem> = z.object({
  ten_hang_hoa: z.string().describe('Tên hàng hoá hoặc dịch vụ. Extract the core product name, excluding units, quantities, and prices (e.g., for "5 lốc bia Tiger", extract "Bia Tiger").'),
  don_vi_tinh: z.string().nullable().describe('The single unit name of the item (e.g., "cái", "chiếc", "hộp", "lốc", "thùng"). Default to "cái" if not mentioned.'),
  so_luong: z.number().nullable().describe('Số lượng của mặt hàng.'),
  don_gia: z.number().nullable().describe('Đơn giá của mặt hàng.'),
  vat: z.number().nullable().describe('Phần trăm thuế GTGT (VAT).'),
});

const InvoiceDataSchema: z.ZodType<TranscriptionResponse> = z.object({
    language: z.string().describe('The detected language of the audio (e.g., "vi-VN").'),
    transcription: z.string().describe('The full transcribed text from the audio.'),
    customer_name: z.string().describe('The name of the customer. Extract ONLY the name, without any titles or prefixes like "Anh" or "Chị" (e.g., for "Anh Trần Minh Long", extract "Trần Minh Long"). Set to an empty string ("") if not mentioned.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the transcription.'),
});

// --- SCHEMAS FOR PRODUCT CREATION (NEW) ---
const UnitConversionSchema = z.object({
    name_unit: z.string().describe("Tên của đơn vị tính (ví dụ: 'Chai', 'Lốc 6 chai', 'Thùng 12 lốc')."),
    conversion_factor: z.number().describe("Hệ số quy đổi ra đơn vị nhỏ nhất (ví dụ: lốc 6 chai = 6, thùng 12 lốc = 72 nếu 1 lốc 6 chai)."),
    unit_default: z.string().describe("Đơn vị nhỏ nhất làm cơ sở quy đổi (ví dụ: 'Chai')."),
    price: z.number().describe("Giá bán của đơn vị này."),
    vat: z.number().nullable().describe("Phần trăm thuế GTGT (VAT). Nếu không có thì để null.")
});

const ProductDataSchema = z.object({
    product_name: z.string().describe("Tên hàng hóa, càng chi tiết càng tốt (bao gồm thể tích nếu có)."),
    unit_conversions: z.array(UnitConversionSchema).describe("Danh sách các đơn vị quy đổi.")
});

// --- SCHEMAS FOR IMPORT SLIP CREATION (NEW) ---
const ImportSlipDataSchema: z.ZodType<ImportSlipData> = z.object({
    supplier_name: z.string().describe('The name of the supplier. Extract a concise name suitable for searching (e.g., for "Nhà cung cấp ABC", extract "ABC"). Set to an empty string ("") if not mentioned.'),
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
    intent: z.enum(['create_invoice', 'create_product', 'create_import_slip', 'unclear']).describe('The user\'s intent. Use "create_product" if the user says "Tạo hàng hóa". Use "create_import_slip" if the user starts with "Nhập kho". Use "create_invoice" for invoicing. Use "unclear" otherwise.'),
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
- If the user starts with "Nhập kho", the intent is 'create_import_slip'.
- If the user starts with "Tạo hàng hóa", the intent is 'create_product'.
- For all other cases related to listing items, prices, quantities for a customer, the intent is 'create_invoice'.
- If the audio is unclear or doesn't match these patterns, the intent is 'unclear'.

Based on the intent, perform one of the following tasks:

### Task 1: Create Invoice (intent: 'create_invoice')
Transcribe the audio and extract invoice information.
- 'customer_name': The customer's name. Crucially, extract ONLY the name, removing any titles or prefixes like "Anh", "Chị", "Cô", "Chú" (e.g., for "Anh Trần Minh Long", extract "Trần Minh Long"). If no name is mentioned, set to an empty string ("").
- 'extracted': A list of items. For each item:
    - 'ten_hang_hoa': Extract the core product name only. Exclude quantities, units, and prices (e.g., for "5 lốc bia Tiger giá 100 nghìn", extract "Bia Tiger").
    - 'don_vi_tinh': Extract the single unit name (e.g., "chai", "lốc", "thùng"). Default to "cái" if not specified.
    - Set missing numerical fields (quantity, price, VAT) to null.
- If no invoice info is found, 'extracted' should be an empty array.
- The full response for this intent MUST conform to the 'invoice_data' schema.

### Task 2: Create Product (intent: 'create_product')
If the audio starts with "Tạo hàng hóa", extract product information based on the description.
- 'product_name': The name of the product, as specific as possible (including volume if available, such as “330ml”, “1.5L”, etc.).
- 'unit_conversions': A list of unit conversions for the product. Each unit includes:
  - 'name_unit': The name of the unit (e.g., “Chai”, “Lốc 6 chai”, “Thùng 12 lốc”).
  - 'conversion_factor': The number of base units contained in this unit (e.g., pack of 6 bottles = 6, carton of 12 packs = 72 if each pack has 6 bottles).
  - 'unit_default': Always the smallest unit used as the conversion base (e.g., “Chai”).
  - 'price': The price of this unit.
  - 'vat': VAT rate if specified, as a decimal number (e.g., 10.0). Leave null if not mentioned.
- If any information is missing, leave the corresponding field empty or null.
- The full response for this intent MUST conform to the 'product_data' schema.

### Task 3: Create Import Slip (intent: 'create_import_slip')
If the audio starts with "Nhập kho", extract import slip information.
- 'supplier_name': The supplier's name. Extract a concise, searchable name. For example, from "Nhập kho từ nhà cung cấp Nước Giải Khát Tân Hiệp Phát", extract "Tân Hiệp Phát". If no name is mentioned, set to an empty string.
- 'extracted': A list of items to be imported, following the same structure as in 'create_invoice'.
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
                output.product_data = { product_name: '', unit_conversions: [] };
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
