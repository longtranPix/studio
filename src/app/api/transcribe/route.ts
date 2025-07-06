// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processAudio } from '@/ai/flows/transcribe-audio-flow';

async function blobToDataUrl(blob: Blob): Promise<string> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ message: 'No audio file uploaded.' }, { status: 400 });
    }

    const audioDataUri = await blobToDataUrl(audioFile);
    
    const result = await processAudio({ audioDataUri });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to process audio: ' + message }, { status: 500 });
  }
}
