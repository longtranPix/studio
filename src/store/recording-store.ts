
// src/store/recording-store.ts
import { create } from 'zustand';

interface RecordingState {
  recordingTrigger: number;
  setRecordingTrigger: () => void;
  clearRecordingTrigger: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  recordingTrigger: 0,
  setRecordingTrigger: () => set((state) => ({ recordingTrigger: state.recordingTrigger + 1 })),
  clearRecordingTrigger: () => set({ recordingTrigger: 0 }),
}));
