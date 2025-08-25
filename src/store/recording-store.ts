// src/store/recording-store.ts
import { create } from 'zustand';
import type { TranscriptionResponse, ProductData, ImportSlipData } from '@/types/order';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'processed' | 'error';
type FormMode = 'order' | 'product' | 'import_slip' | 'none';
type CaptureMode = 'audio' | 'camera';

interface RecordingStoreState {
  // State
  recordingState: RecordingState;
  formMode: FormMode;
  captureMode: CaptureMode;
  countdown: number;
  transcription: string;
  orderData: TranscriptionResponse | null;
  productData: ProductData | null;
  importSlipData: ImportSlipData | null;
  controls: {
    start: boolean;
    stop: boolean;
    capture: boolean; // Add capture trigger
  };

  // Setters
  setRecordingState: (state: RecordingState) => void;
  setFormMode: (mode: FormMode) => void;
  setCaptureMode: (mode: CaptureMode) => void;
  setCountdown: (value: number) => void;
  setTranscription: (text: string) => void;
  setOrderData: (data: TranscriptionResponse | null) => void;
  setProductData: (data: ProductData | null) => void;
  setImportSlipData: (data: ImportSlipData | null) => void;
  setControls: (controls: Partial<RecordingStoreState['controls']>) => void;
  
  // Actions
  reset: () => void;
}

const initialState = {
    recordingState: 'idle' as RecordingState,
    formMode: 'none' as FormMode,
    captureMode: 'audio' as CaptureMode,
    countdown: 0,
    transcription: '',
    orderData: null,
    productData: null,
    importSlipData: null,
    controls: {
        start: false,
        stop: false,
        capture: false, // Initialize capture trigger
    },
};

export const useRecordingStore = create<RecordingStoreState>((set, get) => ({
  ...initialState,
  
  // Setters
  setRecordingState: (state) => set({ recordingState: state }),
  setFormMode: (mode) => set({ formMode: mode }),
  setCaptureMode: (mode) => set({ captureMode: mode }),
  setCountdown: (value) => set({ countdown: value }),
  setTranscription: (text) => set({ transcription: text }),
  setOrderData: (data) => set({ orderData: data }),
  setProductData: (data) => set({ productData: data }),
  setImportSlipData: (data) => set({ importSlipData: data }),
  setControls: (controls) => set(state => ({ controls: { ...state.controls, ...controls } })),

  // Reset action
  reset: () => set(initialState),
}));
