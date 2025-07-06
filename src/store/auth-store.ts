
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
  tableCustomerId: string | null;
  tableProductId: string | null;
  tableImportSlipDetailsId: string | null;
  tableDeliveryNoteDetailsId: string | null;
  tableDeliveryNoteId: string | null;
  tableImportSlipId: string | null;
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
      tableCustomerId: null,
      tableProductId: null,
      tableImportSlipDetailsId: null,
      tableDeliveryNoteDetailsId: null,
      tableDeliveryNoteId: null,
      tableImportSlipId: null,
      _hasHydrated: false,
      login: (userRecord, accessToken) => {
        const { 
          username, 
          business_name, 
          table_order_id, 
          table_order_detail_id, 
          upload_file_id,
          table_customer_id,
          table_product_id,
          table_import_slip_details_id,
          table_delivery_note_details_id,
          table_delivery_note_id,
          table_import_slip_id,
        } = userRecord.fields;
        set({
          isAuthenticated: true,
          accessToken: accessToken,
          username: username,
          businessName: business_name,
          tableOrderId: table_order_id,
          uploadFileId: upload_file_id,
          tableOrderDetailId: table_order_detail_id,
          tableCustomerId: table_customer_id,
          tableProductId: table_product_id,
          tableImportSlipDetailsId: table_import_slip_details_id,
          tableDeliveryNoteDetailsId: table_delivery_note_details_id,
          tableDeliveryNoteId: table_delivery_note_id,
          tableImportSlipId: table_import_slip_id,
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
          tableCustomerId: null,
          tableProductId: null,
          tableImportSlipDetailsId: null,
          tableDeliveryNoteDetailsId: null,
          tableDeliveryNoteId: null,
          tableImportSlipId: null,
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
