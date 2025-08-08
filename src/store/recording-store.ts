// src/store/recording-store.ts
import { create } from 'zustand';
import type { TranscriptionResponse, ProductData, ImportSlipData } from '@/types/order';

type RecordingState = 'idle' | 'permission_pending' | 'recording' | 'processing' | 'processed' | 'error';
type FormMode = 'order' | 'product' | 'import_slip' | 'none';

interface RecordingStoreState {
  // State
  recordingState: RecordingState;
  formMode: FormMode;
  countdown: number;
  transcription: string;
  orderData: TranscriptionResponse | null;
  productData: ProductData | null;
  importSlipData: ImportSlipData | null;
  controls: {
    start: boolean;
    stop: boolean;
  };

  // Setters
  setRecordingState: (state: RecordingState) => void;
  setFormMode: (mode: FormMode) => void;
  setCountdown: (value: number) => void;
  setTranscription: (text: string) => void;
  setOrderData: (data: TranscriptionResponse | null) => void;
  setProductData: (data: ProductData | null) => void;
  setImportSlipData: (data: ImportSlipData | null) => void;
  setControls: (controls: { start: boolean, stop: boolean }) => void;
  
  // Actions
  reset: () => void;
}

const initialState = {
    recordingState: 'idle' as RecordingState,
    formMode: 'none' as FormMode,
    countdown: 0,
    transcription: '',
    orderData: null,
    productData: null,
    importSlipData: null,
    controls: {
        start: false,
        stop: false,
    },
};

export const useRecordingStore = create<RecordingStoreState>((set) => ({
  ...initialState,
  
  // Setters
  setRecordingState: (state) => set({ recordingState: state }),
  setFormMode: (mode) => set({ formMode: mode }),
  setCountdown: (value) => set({ countdown: value }),
  setTranscription: (text) => set({ transcription: text }),
  setOrderData: (data) => set({ orderData: data }),
  setProductData: (data) => set({ productData: data }),
  setImportSlipData: (data) => set({ importSlipData: data }),
  setControls: (controls) => set({ controls }),

  // Reset action
  reset: () => set(initialState),
}));
