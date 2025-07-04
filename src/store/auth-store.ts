
// src/store/auth-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserRecord } from '@/components/auth/auth-form';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  username: string | null;
  businessName: string | null;
  tableOrderId: string | null;
  uploadFileId: string | null;
  tableOrderDetailId: string | null;
  _hasHydrated: boolean;
  login: (userRecord: UserRecord, accessToken: string) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      username: null,
      businessName: null,
      tableOrderId: null,
      uploadFileId: null,
      tableOrderDetailId: null,
      _hasHydrated: false,
      login: (userRecord, accessToken) => {
        const { username, business_name, table_order_id, table_order_detail_id, upload_file_id } = userRecord.fields;
        set({
          isAuthenticated: true,
          accessToken: accessToken,
          username: username,
          businessName: business_name,
          tableOrderId: table_order_id,
          uploadFileId: upload_file_id,
          tableOrderDetailId: table_order_detail_id,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          username: null,
          businessName: null,
          tableOrderId: null,
          tableOrderDetailId: null,
          uploadFileId: null,
        });
      },
      setHasHydrated: (hasHydrated) => {
        set({
          _hasHydrated: hasHydrated,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.setHasHydrated(true);
        }
      },
    }
  )
);
