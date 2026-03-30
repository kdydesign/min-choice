import { create } from "zustand";
import {
  getSelectedChildId,
  getSelectedPlanId,
  setSelectedChildId,
  setSelectedPlanId
} from "../services/storage/preferences-storage";

interface AppStoreState {
  selectedChildId: string;
  selectedPlanId: string;
  setSelectedChild: (childId: string) => void;
  setSelectedPlan: (planId: string) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  selectedChildId: getSelectedChildId(),
  selectedPlanId: getSelectedPlanId(),
  setSelectedChild: (childId) => {
    setSelectedChildId(childId);
    set({ selectedChildId: childId });
  },
  setSelectedPlan: (planId) => {
    setSelectedPlanId(planId);
    set({ selectedPlanId: planId });
  }
}));
