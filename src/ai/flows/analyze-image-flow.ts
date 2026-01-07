'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ExtractedItem, TranscriptionResponse } from '@/types/order';

const ExtractedItemSchema: z.ZodType<ExtractedItem> = z.object({
    ten_hang_hoa: z.string().describe('Tên hàng hoá hoặc dịch vụ.'),
    don_vi_tinh: z.string().nullable().describe('Đơn vị tính của mặt hàng (ví dụ: cái, chiếc, hộp, kg). Nếu không được đề cập, mặc định là "cái".'),
    so_luong: z.number().nullable().describe('Số lượng của mặt hàng.'),
    don_gia: z.number().nullable().describe('Đơn giá của mặt hàng.'),
    vat: z.number().nullable().describe('Phần trăm thuế GTGT (VAT).'),
});

const AnalyzeImageInputSchema = z.object({
    imageDataUri: z
        .string()
        .describe(
            "An image of an invoice, receipt, or physical products/objects, as a data URI that must include a MIME type and use Base64 encoding."
        ),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema: z.ZodType<TranscriptionResponse> = z.object({
    language: z.string().describe('The detected language of the text in the image (e.g., "vi-VN").'),
    transcription: z.string().describe('A summary or full OCR text extracted from the image.'),
    customer_name: z.string().describe('The name of the customer found on the invoice/receipt. Set to empty string if not found.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the image.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

const imagePrompt = ai.definePrompt({
    name: 'analyzeImagePrompt',
    input: { schema: AnalyzeImageInputSchema },
    output: { schema: AnalyzeImageOutputSchema },
    prompt: `You are an expert multimodal AI analyst. You will receive an image which could be an invoice, a receipt, or a collection of physical objects/products. Your goal is to extract structured information for an order.

The language is primarily Vietnamese.

### ANALYSIS STRATEGY:
1. **Scenario Detection**: Determine if the image is a document (invoice/receipt) or a photo of physical products.
2. **If Document (OCR Pathway)**:
   - Extract all line items accurately from the text.
   - For each item, capture: name, unit, quantity, unit price, and VAT.
   - Intelligently guees the "don_vi_tinh" (unit) if missing but implied (e.g., "Lon" for beer, "Gói" for snacks).
3. **If Physical Objects (Visual Pathway)**:
   - Identify each unique type of product/object visible.
   - Count the total number of each product type.
   - Use the count as "so_luong".
   - Assign a logical "don_vi_tinh" based on the object type (e.g., "Quả" for fruit, "Chai" for bottles, "Cái" for general items).
   - Set "don_gia" and "vat" to null.

### OUTPUT REQUIREMENTS:
- **language**: Detected language (e.g., "vi-VN").
- **transcription**: A brief summary of the contents (e.g., "Hóa đơn hàng tạp hóa" or "Phát hiện 3 quả táo và 2 lon nước").
- **customer_name**: Name of customer if present on a document, otherwise an empty string.
- **extracted**: An array of items where:
    - "ten_hang_hoa": Clear, descriptive Vietnamese name. Capitalize the first letter.
    - "don_vi_tinh": The unit of measurement. Capitalize the first letter.
    - "so_luong": The quantity as a number.
    - "don_gia": The unit price as a number (documents only).
    - "vat": The VAT percentage (documents only).

### VIETNAMESE CONTEXT RULES:
- Abbreviations: "sl" -> "so_luong", "dg" -> "don_gia", "đ" -> "VND".
- Parsing numbers: "1.000" is 1000, "1,5" is 1.5.

Image: {{media url=imageDataUri}}`,
});

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
    const { output } = await imagePrompt(input);
    if (!output) throw new Error('Failed to analyze image');
    return output;
}

export const analyzeImageFlow = ai.defineFlow(
    {
        name: 'analyzeImageFlow',
        inputSchema: AnalyzeImageInputSchema,
        outputSchema: AnalyzeImageOutputSchema,
    },
    async (input) => {
        return analyzeImage(input);
    }
);
