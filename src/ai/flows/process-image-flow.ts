'use server';

/**
 * @fileOverview A Genkit flow for processing an image of a product.
 * It can handle invoice creation, product creation, and import slip creation from a photo.
 *
 * - processImage - A function that handles image processing.
 * - ProcessImageInput - The input type for the flow.
 * - ProcessedImageOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractedItem, TranscriptionResponse, ImportSlipData } from '@/types/order';

// --- Re-using schemas from the audio flow ---

// --- SCHEMAS FOR INVOICE CREATION (Based on existing structure) ---
const ExtractedItemSchema: z.ZodType<ExtractedItem> = z.object({
  ten_hang_hoa: z.string().describe('CRITICAL! Extract the core product name, focusing on the BRAND or most UNIQUE identifier for searching. REMOVE generic prefixes (like "Mì Tôm", "Nước ngọt"), quantities, units, and prices. For example, for "5 lốc bia Tiger", extract "Tiger". For "Mì Tôm Hảo Hảo", extract "Hảo Hảo". For "Sting", extract "Sting". This text MUST be optimized for searching.'),
  don_vi_tinh: z.string().nullable().describe('The single unit name of the item (e.g., "cái", "chiếc", "hộp", "lốc", "thùng"). Default to "cái" if not mentioned.'),
  so_luong: z.number().nullable().describe('Số lượng của mặt hàng.'),
  don_gia: z.number().nullable().describe('Đơn giá của mặt hàng. IMPORTANT: For invoice creation, the price is defined in the system. Always set this field to null.'),
  vat: z.number().default(0).describe('Phần trăm thuế GTGT (VAT). Default to 0 if not mentioned.'),
});

const InvoiceDataSchema: z.ZodType<TranscriptionResponse> = z.object({
    language: z.string().describe('The detected language of the text in the image (e.g., "vi-VN").'),
    transcription: z.string().describe('The full text transcribed from the image.'),
    customer_name: z.string().describe('The name of the customer. Extract ONLY the name, without any titles or prefixes like "Anh" or "Chị" (e.g., for "Anh Trần Minh Long", extract "Trần Minh Long"). Set to an empty string ("") if not mentioned.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the image.'),
});

// --- SCHEMAS FOR PRODUCT CREATION (NEW) ---
const UnitConversionSchema = z.object({
    name_unit: z.string().describe("Tên của đơn vị tính cơ bản (ví dụ: 'Chai', 'Lốc', 'Thùng'). CRITICAL: Extract only the base unit name and CAPITALIZE the first letter. For 'Lốc 6 chai', extract 'Lốc'. For 'thùng 12 lốc', extract 'Thùng'."),
    conversion_factor: z.number().describe("Hệ số quy đổi ra đơn vị nhỏ nhất (ví dụ: lốc 6 chai = 6, thùng 12 lốc = 72 nếu 1 lốc 6 chai)."),
    unit_default: z.string().describe("Đơn vị nhỏ nhất làm cơ sở quy đổi (ví dụ: 'Chai')."),
    price: z.number().describe("Giá bán của đơn vị này. IMPORTANT VIETNAMESE CURRENCY RULE: If you see a number like '140' or '25', it implies '140,000' or '25,000'. You MUST multiply these abbreviated numbers by 1000. For '25 triệu', you must extract 25000000. Example: 'giá 140' -> 140000."),
    vat: z.number().default(0).describe("Phần trăm thuế GTGT (VAT). Nếu không có thì để 0.")
});

const CatalogSchema = z.object({
    type: z.string().describe("The type or category of the attribute (e.g., 'Màu sắc', 'Kích cỡ', 'Kiểu dáng'). Extract this from product descriptions or labels."),
    value: z.string().describe("The specific value of the attribute (e.g., 'Đen', 'L', 'Cổ cao'). If the value is not mentioned for an inferred attribute, this MUST be an empty string, not null.")
});

const ProductDataSchema = z.object({
    product_name: z.string().describe("Tên hàng hóa, càng chi tiết càng tốt (bao gồm thể tích nếu có), based on the product image."),
    brand_name: z.string().nullable().describe('The brand of the product (e.g., "Sting", "Tiger", "Hảo Hảo"). Extract a concise brand name from the image, suitable for searching. Set to null if not mentioned.'),
    unit_conversions: z.array(UnitConversionSchema).describe("Danh sách các đơn vị quy đổi. Infer a single logical unit if not specified in the image."),
    catalog: z.string().nullable().describe("The main category or catalog of the product (e.g., 'Bóng đèn', 'Giày', 'Áo sơ mi'). Infer from the product image."),
    attributes: z.array(CatalogSchema).nullable().describe("A list of product attributes, like color, size, or style. Infer from the image and generate a comprehensive list based on the catalog.")
});

// --- SCHEMAS FOR IMPORT SLIP CREATION (NEW) ---
const ImportSlipDataSchema: z.ZodType<ImportSlipData> = z.object({
    supplier_name: z.string().describe('The name of the supplier. Try to find it in the image if it is a receipt, otherwise set to empty string("").'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the image for the import slip.'),
});


// --- COMBINED FLOW SCHEMAS ---
const ProcessImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  intent: z.enum(['create_invoice', 'create_product', 'create_import_slip']).describe('The user\'s chosen action for the image.'),
});
export type ProcessImageInput = z.infer<typeof ProcessImageInputSchema>;

const ProcessedImageOutputSchema = z.object({
    intent: z.enum(['create_invoice', 'create_product', 'create_import_slip', 'unclear']).describe('The user\'s intent. This should match the input intent.'),
    transcription: z.string().describe('The full text transcribed from the image if any. If no text, describe the image.'),
    invoice_data: InvoiceDataSchema.nullable().describe('The extracted invoice data if intent is "create_invoice".'),
    product_data: ProductDataSchema.nullable().describe('The extracted product data if intent is "create_product".'),
    import_slip_data: ImportSlipDataSchema.nullable().describe('The extracted import slip data if intent is "create_import_slip".')
});
export type ProcessedImageOutput = z.infer<typeof ProcessedImageOutputSchema>;


export async function processImage(input: ProcessImageInput): Promise<ProcessedImageOutput> {
  return processImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processImagePrompt',
  input: {schema: ProcessImageInputSchema},
  output: {schema: ProcessedImageOutputSchema},
  prompt: `You are an intelligent assistant for an invoicing and inventory app in Vietnamese. Your primary job is to analyze an image of a product and extract structured data based on the user's specified intent.

The user has provided an image and chosen the intent: '{{{intent}}}'.

Based on the intent, perform one of the following tasks:

### Task 1: Create Product (intent: 'create_product')
Analyze the product in the image and extract detailed information.
- 'product_name': The full, detailed name of the product from the image.
- 'brand_name': Extract the brand name from the image (e.g., "Điện Quang", "Nike").
- 'catalog': The primary product category (e.g., "Bóng đèn", "Nước ngọt", "Giày"). This is the most general classification you can infer from the image.
- 'attributes': A list of attribute type-value pairs.
    - **CRITICAL RULE**: Use your extensive general knowledge about products to generate a comprehensive list of relevant attributes for the identified 'catalog'.
    - First, extract all attribute values you can see in the image (e.g., for an image of a "Red Macbook Pro 16GB RAM", extract \`value: "Đỏ"\` for \`type: "Màu sắc"\` and \`value: "16GB"\` for \`type: "RAM"\`).
    - Second, for the same catalog, infer OTHER relevant attributes that a user would typically want to specify for that product type, but leave their 'value' as an EMPTY STRING ("") if you cannot determine it from the image.
    - **Example Workflow**:
        1. User provides an image of a "Coca-Cola" can.
        2. You identify 'catalog' as "Nước ngọt".
        3. Based on your knowledge of soft drinks, you know relevant attributes are "Hương vị", "Loại", "Dung tích".
        4. You extract the value for "Hương vị" as "Cola", "Loại" as "Có ga", "Dung tích" as "330ml".
        5. You generate the following attributes list: \`[{"type": "Hương vị", "value": "Cola"}, {"type": "Loại", "value": "Có ga"}, {"type": "Dung tích", "value": "330ml"}]\`.
- 'unit_conversions': A list of unit conversions.
  - If the image shows a single item (e.g., one can), you MUST infer a logical default unit (e.g., "Lon" for a can). Create a single entry in 'unit_conversions' with this default unit, setting 'conversion_factor' to 1, and 'unit_default' to the same unit name. Set price and VAT to 0, as they cannot be known from a product picture alone.
- The full response for this intent MUST conform to the 'product_data' schema.

### Task 2: Create Invoice (intent: 'create_invoice')
Analyze the image. This intent is typically for an image of a shopping list or a previous invoice.
- Transcribe any text and extract invoice information.
- 'customer_name': The customer's name, if present in the text.
- 'extracted': A list of items. For each item:
    - 'ten_hang_hoa': Extract the core product name, optimized for searching.
    - 'so_luong': The quantity of the item.
    - 'don_vi_tinh': The unit of the item.
    - 'don_gia': CRITICAL RULE! For creating an invoice, DO NOT guess the price. You MUST ALWAYS set this field to null.
- The full response for this intent MUST conform to the 'invoice_data' schema.

### Task 3: Create Import Slip (intent: 'create_import_slip')
Analyze the image, which is likely a product or a receipt.
- 'supplier_name': Try to find a supplier name if the image is a receipt. If it's just a product, set this to an empty string.
- 'extracted': A list of items. For this intent, the user will likely fill in the price manually later.
    - 'ten_hang_hoa': Extract the core product name from the image.
    - 'so_luong': Set to 1 unless specified in the image.
    - 'don_vi_tinh': The unit of the item (e.g., "chai", "hộp").
    - 'don_gia': The cost price. If it's just a product picture, set this to null. If it's a receipt with a price, extract it following the VIETNAMESE CURRENCY RULE (e.g., '140' -> 140000).
- The full response for this intent MUST conform to the 'import_slip_data' schema.


### Final Output
Your final response MUST be a single JSON object matching the 'ProcessedImageOutputSchema', containing the 'intent', 'transcription' (describe the image if no text is present), and ONLY the relevant data object ('invoice_data', 'product_data', OR 'import_slip_data', the others must be null). Do not include comments or extra text — only return the JSON.

Image: {{media url=imageDataUri}}`,
});

const processImageFlow = ai.defineFlow(
  {
    name: 'processImageFlow',
    inputSchema: ProcessImageInputSchema,
    outputSchema: ProcessedImageOutputSchema,
    config: {
      model: 'googleai/gemini-1.5-flash-latest'
    }
  },
  async input => {
    const {output} = await prompt(input);
    
    // Post-processing to ensure data consistency
    if (output) {
        if (output.intent === 'create_invoice') {
            output.product_data = null;
            output.import_slip_data = null;
        } else if (output.intent === 'create_product') {
            output.invoice_data = null;
            output.import_slip_data = null;
        } else if (output.intent === 'create_import_slip') {
            output.invoice_data = null;
            output.product_data = null;
        }
    }
    return output!;
  }
);
