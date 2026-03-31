const SELECTED_CHILD_KEY = "min-baby-meals.selected-child-id";
const LEGACY_SELECTED_PLAN_KEY = "min-baby-meals.selected-plan-id";

export function getSelectedChildId() {
  return localStorage.getItem(SELECTED_CHILD_KEY) ?? "";
}

export function setSelectedChildId(childId: string) {
  if (!childId) {
    localStorage.removeItem(SELECTED_CHILD_KEY);
    return;
  }

  localStorage.setItem(SELECTED_CHILD_KEY, childId);
}

export function clearLegacySelectedPlanId() {
  localStorage.removeItem(LEGACY_SELECTED_PLAN_KEY);
}
