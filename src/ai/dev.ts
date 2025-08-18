import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-transcription.ts';
import '@/ai/flows/transcribe-audio-flow.ts';
import '@/ai/flows/process-image-flow.ts';
