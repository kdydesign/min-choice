import { create } from "zustand";
import {
  clearLegacySelectedPlanId,
  getSelectedChildId,
  setSelectedChildId
} from "../services/storage/preferences-storage";

interface AppStoreState {
  selectedChildId: string;
  selectedPlanId: string;
  setSelectedChild: (childId: string) => void;
  setSelectedPlan: (planId: string) => void;
}

clearLegacySelectedPlanId();

export const useAppStore = create<AppStoreState>((set) => ({
  selectedChildId: getSelectedChildId(),
  selectedPlanId: "",
  setSelectedChild: (childId) => {
    setSelectedChildId(childId);
    set({ selectedChildId: childId });
  },
  setSelectedPlan: (planId) => {
    set({ selectedPlanId: planId });
  }
}));
