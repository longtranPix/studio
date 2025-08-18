// src/app/api/process-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/ai/flows/process-image-flow';
import type { ProcessImageInput } from '@/ai/flows/process-image-flow';

export async function POST(request: NextRequest) {
  try {
    const { imageDataUri, intent } = await request.json();

    if (!imageDataUri || !intent) {
      return NextResponse.json({ message: 'Missing imageDataUri or intent.' }, { status: 400 });
    }

    const input: ProcessImageInput = { imageDataUri, intent };
    const result = await processImage(input);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/process-image:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to process image: ' + message }, { status: 500 });
  }
}
