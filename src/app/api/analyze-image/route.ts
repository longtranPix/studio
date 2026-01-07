// src/app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/ai/flows/analyze-image-flow';

async function blobToDataUrl(blob: Blob): Promise<string> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;

        if (!imageFile) {
            return NextResponse.json({ message: 'No image file uploaded.' }, { status: 400 });
        }

        const imageDataUri = await blobToDataUrl(imageFile);

        const result = await analyzeImage({ imageDataUri });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in /api/analyze-image:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Failed to process image: ' + message }, { status: 500 });
    }
}

export const maxDuration = 60;
