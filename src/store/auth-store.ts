// src/store/auth-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserRecord } from '@/components/auth/auth-form';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  businessName: string | null;
  tableOrderId: string | null;
  tableOrderDetailId: string | null;
  _hasHydrated: boolean;
  login: (userRecord: UserRecord) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      businessName: null,
      tableOrderId: null,
      tableOrderDetailId: null,
      _hasHydrated: false,
      login: (userRecord) => {
        const { username, business_name, table_order_id, table_order_detail_id } = userRecord.fields;
        set({
          isAuthenticated: true,
          username: username,
          businessName: business_name,
          tableOrderId: table_order_id,
          tableOrderDetailId: table_order_detail_id,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          username: null,
          businessName: null,
          tableOrderId: null,
          tableOrderDetailId: null,
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
