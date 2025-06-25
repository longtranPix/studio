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
    customer_name: z.string().nullable().describe('The name of the customer. Can be a full name with title (e.g., "Anh Trần Minh Long", "Chị Khả Như") or a generic description (e.g., "Khách mua lẻ", "Khách vãng lai"). Set to null if not mentioned.'),
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

Your tasks are:
1. Transcribe the audio accurately.
2. Identify and extract the customer's name into the 'customer_name' field. The customer might be referred to with a formal title (e.g., "Anh Trần Minh Long", "Chị Khả Như"), or a generic description (e.g., "Khách mua lẻ", "Khách hàng vãng lai"). If no customer is mentioned, set this field to null.
3. Extract all items mentioned into the 'extracted' array, including their quantity ("so_luong"), unit price ("don_gia"), and VAT percentage ("vat").
4. If any piece of information for an item (quantity, price, VAT) is not mentioned, you MUST set its value to null.
5. CRITICAL: If the audio contains no information about products, prices, or a customer name for an invoice, return an empty array for the 'extracted' field and set 'customer_name' to null. Continue to provide the full transcription.
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
