'use server';

/**
 * @fileOverview A Genkit flow for transcribing audio and extracting invoice data.
 *
 * - transcribeAndExtract - A function that handles the audio transcription and data extraction process.
 * - TranscribeAndExtractInput - The input type for the transcribeAndExtract function.
 * - TranscribeAndExtractOutput - The return type for the transcribeAndExtract function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractedItem, TranscriptionResponse } from '@/types/order';

const ExtractedItemSchema: z.ZodType<ExtractedItem> = z.object({
  ten_hang_hoa: z.string().describe('Tên hàng hoá hoặc dịch vụ.'),
  don_vi_tinh: z.string().nullable().describe('Đơn vị tính của mặt hàng (ví dụ: cái, chiếc, hộp, kg). Nếu không được đề cập, mặc định là "cái".'),
  so_luong: z.number().nullable().describe('Số lượng của mặt hàng.'),
  don_gia: z.number().nullable().describe('Đơn giá của mặt hàng.'),
  vat: z.number().nullable().describe('Phần trăm thuế GTGT (VAT).'),
});

const TranscribeAndExtractInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAndExtractInput = z.infer<typeof TranscribeAndExtractInputSchema>;


const TranscribeAndExtractOutputSchema: z.ZodType<TranscriptionResponse> = z.object({
    language: z.string().describe('The detected language of the audio (e.g., "vi-VN").'),
    transcription: z.string().describe('The full transcribed text from the audio.'),
    customer_name: z.string().describe('The name of the customer. Can be a full name with title (e.g., "Anh Trần Minh Long", "Chị Khả Như") or a generic description (e.g., "Khách mua lẻ", "Khách vãng lai"). Set to an empty string ("") if not mentioned.'),
    extracted: z.array(ExtractedItemSchema).nullable().describe('A list of items extracted from the transcription.'),
});
export type TranscribeAndExtractOutput = z.infer<typeof TranscribeAndExtractOutputSchema>;

export async function transcribeAndExtract(input: TranscribeAndExtractInput): Promise<TranscribeAndExtractOutput> {
  return transcribeAndExtractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeAndExtractPrompt',
  input: {schema: TranscribeAndExtractInputSchema},
  output: {schema: TranscribeAndExtractOutputSchema},
  prompt: `You are an expert at transcribing audio and extracting structured information from it for invoicing purposes. The language of the audio is Vietnamese.

IMPORTANT: You must understand Vietnamese local language patterns and colloquialisms, especially for numbers and amounts:

Vietnamese Number Patterns:
- "hai trăm rưỡi" = 250,000 VND (250k)
- "ba trăm rưỡi" = 350,000 VND (350k)
- "năm trăm rưỡi" = 550,000 VND (550k)
- "một triệu rưỡi" = 1,500,000 VND (1.5M)
- "hai triệu rưỡi" = 2,500,000 VND (2.5M)
- "nửa triệu" = 500,000 VND (500k)
- "hai chục" = 20
- "ba chục" = 30
- "năm chục" = 50
- "một chục" = 10

Common Vietnamese Business Terms:
- "đơn giá" = unit price
- "thành tiền" = total amount
- "tiền thuế" = tax amount
- "tổng cộng" = total
- "khách lẻ" = retail customer
- "khách sỉ" = wholesale customer
- "giá sỉ" = wholesale price
- "giá lẻ" = retail price

Your tasks are:
1. Transcribe the audio accurately, understanding Vietnamese colloquialisms and local expressions.
2. Convert Vietnamese number expressions to actual numeric values (e.g., "hai trăm rưỡi" → 250000).
3. Identify and extract the customer's name into the 'customer_name' field. The customer might be referred to with a formal title (e.g., "Anh Trần Minh Long", "Chị Khả Như"), or a generic description (e.g., "Khách mua lẻ", "Khách hàng vãng lai"). If no customer is mentioned, set this field to an empty string ("").
4. Extract all items mentioned into the 'extracted' array, including their name ("ten_hang_hoa"), unit of measure ("don_vi_tinh"), quantity ("so_luong"), unit price ("don_gia"), and VAT percentage ("vat").
5. For the unit of measure ("don_vi_tinh"), follow this priority:
   a) FIRST PRIORITY: Use the exact unit mentioned in the voice-to-text transcription if it exists
   b) SECOND PRIORITY: If no unit is mentioned, intelligently analyze the product name to determine the most appropriate unit based on Vietnamese business context
   
   Common Vietnamese product-to-unit mappings:
   - Food items (bánh, kẹo, snack): "Cái", "Gói", "Hộp"
   - Beverages (nước, cà phê, trà): "Chai", "Lon", "Cốc"
   - Weight-based items (thịt, cá, rau): "Kg", "Gram"
   - Volume-based items (sữa, dầu): "Lít", "Ml"
   - Clothes/shoes: "Cái", "Chiếc", "Đôi"
   - Electronics: "Cái", "Chiếc"
   - Books/documents: "Cuốn", "Quyển", "Tờ"
   - Construction materials: "M2", "M3", "Thùng", "Bao"
   - Office supplies: "Cái", "Bút", "Tờ"
   - If uncertain, default to "Cái" (capitalized)
6. If any other piece of information for an item (quantity, price, VAT) is not mentioned, you MUST set its value to null.
7. CRITICAL: If the audio contains no information about products, prices, or a customer name for an invoice, return an empty array for the 'extracted' field and set 'customer_name' to an empty string (""). Continue to provide the full transcription.
8. When extracting prices and amounts, convert Vietnamese colloquial number expressions to standard numeric values.
9. FORMATTING RULES:
   - Always capitalize the first letter of product names ("ten_hang_hoa")
   - Always capitalize the first letter of unit names ("don_vi_tinh")
   - Examples: "bánh mì" → "Bánh mì", "cái" → "Cái", "chai" → "Chai", "kg" → "Kg"

The final response must be in the specified JSON format.

Audio: {{media url=audioDataUri}}`,
});

const transcribeAndExtractFlow = ai.defineFlow(
  {
    name: 'transcribeAndExtractFlow',
    inputSchema: TranscribeAndExtractInputSchema,
    outputSchema: TranscribeAndExtractOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
