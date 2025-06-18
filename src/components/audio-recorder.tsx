
'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Loader2, UploadCloud, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'transcribed' | 'error';

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const MAX_RECORDING_TIME_SECONDS = 60; // Max 1 minute recording

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      stopMediaStream();
    };
  }, []);

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCountdown = () => {
    setCountdown(MAX_RECORDING_TIME_SECONDS);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          handleStopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartRecording = async () => {
    setTranscription(null);
    setAudioBlob(null);
    setRecordingState('permission_pending');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ title: 'Error', description: 'Media devices API not supported in this browser.', variant: 'destructive' });
        setRecordingState('error');
        return;
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingState('recording');
      toast({ title: 'Recording Started', description: 'Microphone is active.', duration: 3000 });

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopMediaStream();
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; // Clear chunks for next recording
        setAudioBlob(completeAudioBlob);
        setRecordingState('processing');
        await uploadAudio(completeAudioBlob);
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({ title: 'Recording Error', description: 'An error occurred with the media recorder.', variant: 'destructive'});
        setRecordingState('error');
        stopMediaStream();
         if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };

      recorder.start();
      startCountdown();

    } catch (err) {
      console.error('Error accessing microphone:', err);
      const errorMessage = (err instanceof Error && err.name === 'NotAllowedError')
        ? 'Microphone access denied. Please allow microphone permission in your browser settings.'
        : 'Could not access microphone. Please ensure it is connected and not in use by another application.';
      toast({ title: 'Microphone Error', description: errorMessage, variant: 'destructive' });
      setRecordingState('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // onstop callback will handle the rest
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(0);
  };

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData();
    // Use 'file' as the field name, and 'recording.webm' as the filename.
    // The type is inferred from the Blob if not specified, but 'audio/webm' is what we have.
    formData.append('file', blob, 'recording.webm'); 

    try {
      // Explicitly set Content-Type header
      const response = await axios.post('https://order-voice.appmkt.vn/transcribe/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setTranscription(response.data.transcription);
      setRecordingState('transcribed');
      toast({ title: 'Transcription Complete', description: 'Your audio has been transcribed.', duration: 3000 });
    } catch (err) {
      console.error('Error uploading audio:', err);
      let message = 'Failed to transcribe audio. Please try again.';
      if (axios.isAxiosError(err) && err.response) {
        const responseData = err.response.data;
        if (responseData && typeof responseData === 'object' && 'message' in responseData && typeof responseData.message === 'string') {
           message = responseData.message || err.message;
        } else if (responseData && typeof responseData === 'object' && 'transcription' in responseData && typeof responseData.transcription === 'string') {
           // Handle cases where error might be in transcription field or a generic message
           message = `API Error: ${responseData.transcription || err.message}`;
        } else if (typeof responseData === 'string' && responseData.length > 0) {
           message = responseData;
        } else {
           message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast({ title: 'Transcription Failed', description: message, variant: 'destructive' });
      setRecordingState('error');
      setTranscription(null);
    }
  };

  const getButtonIcon = () => {
    if (recordingState === 'recording') return <Square className="mr-2 h-5 w-5" />;
    if (recordingState === 'processing' || recordingState === 'permission_pending') return <Loader2 className="mr-2 h-5 w-5 animate-spin" />;
    return <Mic className="mr-2 h-5 w-5" />;
  };
  
  const getButtonText = () => {
    if (recordingState === 'recording') return `Stop Recording (${countdown}s)`;
    if (recordingState === 'permission_pending') return 'Requesting Mic...';
    if (recordingState === 'processing') return 'Transcribing...';
    return 'Start Recording';
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <UploadCloud className="mr-3 h-7 w-7 text-primary" />
          Record Audio
        </CardTitle>
        <CardDescription>
          Click "Start Recording" to begin. Max duration: {MAX_RECORDING_TIME_SECONDS} seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
            disabled={recordingState === 'processing' || recordingState === 'permission_pending'}
            className="w-full max-w-xs text-lg py-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-accent/50"
            variant={recordingState === 'recording' ? 'destructive' : 'default'}
            aria-live="polite"
            aria-label={recordingState === 'recording' ? 'Stop audio recording' : 'Start audio recording'}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
          {recordingState === 'recording' && (
            <div className="w-full max-w-xs">
              <Progress value={(MAX_RECORDING_TIME_SECONDS - countdown) / MAX_RECORDING_TIME_SECONDS * 100} className="h-2 [&>div]:bg-destructive" />
              <p className="text-sm text-center mt-1 text-muted-foreground">Time remaining: {countdown}s</p>
            </div>
          )}
        </div>

        {transcription && recordingState === 'transcribed' && (
          <Card className="bg-secondary/30 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline">
                <FileText className="mr-2 h-6 w-6 text-primary" />
                Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-wrap p-4 bg-background rounded-md shadow">
                {transcription}
              </p>
            </CardContent>
          </Card>
        )}

        {recordingState === 'error' && !transcription && (
           <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-destructive-foreground">
                <AlertTriangle className="mr-2 h-6 w-6 text-destructive-foreground" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive-foreground">
                Could not process audio. Please check permissions or try again.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
         {audioBlob && recordingState !== 'processing' && (
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" aria-label="Recorded audio player">
                Your browser does not support the audio element.
            </audio>
        )}
      </CardFooter>
    </Card>
  );
}

