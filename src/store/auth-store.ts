
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
  tableUnitConversionsId: string | null;
  tableImportSlipDetailsId: string | null;
  tableDeliveryNoteDetailsId: string | null;
  tableDeliveryNoteId: string | null;
  tableImportSlipId: string | null;
  productViewId: string | null;
  tableSupplierId: string | null;
  tableBrandId: string | null;
  tableCatalogId: string | null;
  brandViewId: string | null;
  tableAttributeId: string | null;
  tableAttributeTypeId: string | null;
  attributeViewId: string | null;
  currentPlanId: string | null;
  creditValue: number | null;
  planStatus: 'active' | 'inactive' | null;
  _hasHydrated: boolean;
  login: (data: { userRecord: UserRecord; accessToken: string; productViewId: string; brandViewId: string; attributeViewId: string; }) => void;
  logout: () => void;
  setCreditValue: (value: number | null) => void;
  setPlanStatus: (status: 'active' | 'inactive' | null) => void;
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
      tableUnitConversionsId: null,
      tableImportSlipDetailsId: null,
      tableDeliveryNoteDetailsId: null,
      tableDeliveryNoteId: null,
      tableImportSlipId: null,
      productViewId: null,
      tableSupplierId: null,
      tableBrandId: null,
      tableCatalogId: null,
      brandViewId: null,
      tableAttributeId: null,
      tableAttributeTypeId: null,
      attributeViewId: null,
      currentPlanId: null,
      creditValue: null,
      planStatus: null,
      _hasHydrated: false,
      login: ({ userRecord, accessToken, productViewId, brandViewId, attributeViewId }) => {
        const { 
          username, 
          business_name, 
          table_order_id, 
          table_order_detail_id, 
          upload_file_id,
          table_customer_id,
          table_product_id,
          table_unit_conversions_id,
          table_import_slip_details_id,
          table_delivery_note_details_id,
          table_delivery_note_id,
          table_import_slip_id,
          table_supplier_id,
          table_brand_id,
          table_catalog_id,
          table_attribute_id,
          table_attribute_type_id,
          current_plan,
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
          productViewId: productViewId,
          tableUnitConversionsId: table_unit_conversions_id,
          tableImportSlipDetailsId: table_import_slip_details_id,
          tableDeliveryNoteDetailsId: table_delivery_note_details_id,
          tableDeliveryNoteId: table_delivery_note_id,
          tableImportSlipId: table_import_slip_id,
          tableSupplierId: table_supplier_id,
          tableBrandId: table_brand_id,
          tableCatalogId: table_catalog_id,
          brandViewId: brandViewId,
          tableAttributeId: table_attribute_id,
          tableAttributeTypeId: table_attribute_type_id,
          attributeViewId: attributeViewId,
          currentPlanId: current_plan?.id ?? null,
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
          productViewId: null,
          tableUnitConversionsId: null,
          tableImportSlipDetailsId: null,
          tableDeliveryNoteDetailsId: null,
          tableDeliveryNoteId: null,
          tableImportSlipId: null,
          tableSupplierId: null,
          tableBrandId: null,
          tableCatalogId: null,
          brandViewId: null,
          tableAttributeId: null,
          tableAttributeTypeId: null,
          attributeViewId: null,
          currentPlanId: null,
          creditValue: null,
          planStatus: null,
        });
      },
      setCreditValue: (value: number | null) => {
        set({ creditValue: value });
      },
       setPlanStatus: (status) => {
        set({ planStatus: status });
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

    