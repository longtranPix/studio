// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { summarizeTranscription } from '@/ai/flows/summarize-transcription'; // This is for summarization, not transcription

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ message: 'No audio file uploaded.' }, { status: 400 });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real application, you would send `audioFile` to a speech-to-text service.
    // For this mock, we'll just return a predefined text.
    // The provided GenAI flow `summarizeTranscription` is for text summarization, not speech-to-text from audio.
    // Therefore, we cannot use it directly here to convert audio to text.

    const mockTranscription = `This is a mock transcription of your recorded audio. 
The audio file received was named "${audioFile.name}" and has a size of ${audioFile.size} bytes. 
In a real application, this text would be the result of an AI speech-to-text service. 
For example, if you said "Hello world, this is a test", the service would return that text.
The current time is ${new Date().toLocaleTimeString()}. You can integrate a real transcription service here.
This example uses a placeholder. One two three, testing, testing.`;
    
    // If you wanted to use the summarizeTranscription flow with this mock text (for demonstration):
    // try {
    //   const summaryOutput = await summarizeTranscription({ transcription: mockTranscription });
    //   return NextResponse.json({ transcription: summaryOutput.summary });
    // } catch (aiError) {
    //   console.error("AI summarization error:", aiError);
    //   // Fallback to mock transcription if summarization fails
    //   return NextResponse.json({ transcription: mockTranscription });
    // }
    
    return NextResponse.json({ transcription: mockTranscription });

  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to process audio: ' + message }, { status: 500 });
  }
}
