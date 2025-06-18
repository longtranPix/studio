# **App Name**: VocalNote

## Core Features:

- Record Controls: Displays 'Start Recording' and 'Stop Recording' buttons.
- Audio Capture: Captures audio input from the user's microphone using MediaRecorder.
- Audio Upload: Encodes audio as .webm and sends it via multipart/form-data to a speech-to-text API endpoint.
- Transcription Display: Renders the transcribed text received from the speech-to-text API.
- PWA Configuration: Configures Vite with react-plugin-pwa for PWA installability with a manifest and service worker.
- Speech-to-Text: Utilizes an AI transcription tool to convert audio input to text.

## Style Guidelines:

- Primary color: Deep sky blue (#00BFFF) for a modern and clean interface.
- Background color: Light cyan (#E0FFFF) to ensure high contrast.
- Accent color: Sky blue (#87CEEB) for interactive elements and highlights.
- Body and headline font: 'Inter' sans-serif for a neutral and modern feel.
- Use simple, outline-style icons to represent actions and states (e.g., recording, uploading).
- Maintain a clean and spacious layout, focusing on readability and ease of use.
- Subtle animations for recording status, uploading, and transcription updates.