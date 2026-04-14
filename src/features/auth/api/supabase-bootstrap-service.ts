import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isUuid } from "../../../lib/is-uuid";
import { getSupabaseClient } from "../../../lib/supabase";
import { removeValue, readJson, writeJson } from "../../../services/storage/browser-storage";
import { getSelectedChildId, setSelectedChildId } from "../../../services/storage/preferences-storage";
import { MEAL_TYPES, type ChildProfile, type DailyMealPlan, type MealDraft, type MealType } from "../../../types/domain";
import {
  buildMealInputRows,
  buildMealPlanItemRows,
  getMealPlanDateOnly
} from "../../meal-plans/lib/meal-plan-persistence";

const LEGACY_CHILDREN_STORAGE_KEY = "min-baby-meals.profiles";
const LEGACY_MEAL_PLANS_STORAGE_KEY = "min-baby-meals.meal-plans";
const DRAFT_STORAGE_KEY = "min-baby-meals.drafts";
const MIGRATION_STATE_KEY = "min-baby-meals.supabase-migration.v1";

interface ChildRow {
  id: string;
  name: string;
  age_months: number | null;
  birth_date: string | null;
  created_at: string;
}

interface MealPlanRow {
  id: string;
  child_id: string;
  created_at: string;
}

let ensureSessionPromise: Promise<Session | null> | null = null;
let bootstrapPromise: Promise<void> | null = null;
let hasBootstrappedPersistence = false;

function sortDraftEntries(entries: Array<[string, MealDraft]>) {
  return [...entries].sort((left, right) => {
    const leftTime = left[1].updatedAt ? new Date(left[1].updatedAt).getTime() : 0;
    const rightTime = right[1].updatedAt ? new Date(right[1].updatedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

async function migrateLocalDataToSupabase(userId: string) {
  if (localStorage.getItem(MIGRATION_STATE_KEY) === "done") {
    return;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const localProfiles = readJson<ChildProfile[]>(LEGACY_CHILDREN_STORAGE_KEY, []);
  const localMealPlans = readJson<DailyMealPlan[]>(LEGACY_MEAL_PLANS_STORAGE_KEY, []);
  const localDrafts = readJson<Record<string, MealDraft>>(DRAFT_STORAGE_KEY, {});

  if (
    localProfiles.length === 0 &&
    localMealPlans.length === 0 &&
    Object.keys(localDrafts).length === 0
  ) {
    localStorage.setItem(MIGRATION_STATE_KEY, "done");
    return;
  }

  const { data: existingChildren, error: childrenError } = await supabase
    .from("children")
    .select("id, name, age_months, birth_date, created_at")
    .eq("owner_user_id", userId);

  if (childrenError) {
    throw childrenError;
  }

  const childIdMap = new Map<string, string>();
  const nextChildren = [...(existingChildren ?? [])];

  for (const profile of [...localProfiles].sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )) {
    const matchedChild = nextChildren.find((candidate) => {
      const sameCreatedAt = candidate.created_at === profile.createdAt;
      const sameIdentity =
        candidate.name === profile.name &&
        (candidate.birth_date ?? "") === profile.birthDate &&
        (candidate.age_months ?? null) === profile.ageMonths;

      return sameCreatedAt || sameIdentity;
    });

    if (matchedChild) {
      childIdMap.set(profile.id, matchedChild.id);
      continue;
    }

    const { data: insertedChild, error: insertChildError } = await supabase
      .from("children")
      .insert({
        owner_user_id: userId,
        name: profile.name,
        birth_date: profile.birthDate || null,
        age_months: profile.ageMonths,
        allergies_json: uniqueStrings(profile.allergies),
        created_at: profile.createdAt,
        updated_at: profile.updatedAt
      })
      .select("id, name, age_months, birth_date, created_at")
      .single<ChildRow>();

    if (insertChildError) {
      throw insertChildError;
    }

    nextChildren.push(insertedChild);
    childIdMap.set(profile.id, insertedChild.id);
  }

  const migratedChildIds = [...new Set(childIdMap.values())];
  const existingPlansByKey = new Map<string, string>();

  if (migratedChildIds.length > 0) {
    const { data: existingPlans, error: plansError } = await supabase
      .from("meal_plans")
      .select("id, child_id, created_at")
      .in("child_id", migratedChildIds);

    if (plansError) {
      throw plansError;
    }

    (existingPlans ?? []).forEach((plan) => {
      existingPlansByKey.set(`${plan.child_id}:${plan.created_at}`, plan.id);
    });
  }

  for (const plan of [...localMealPlans].sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )) {
    const nextChildId = childIdMap.get(plan.childId);

    if (!nextChildId) {
      continue;
    }

    const existingPlanId = existingPlansByKey.get(`${nextChildId}:${plan.createdAt}`);

    if (existingPlanId) {
      continue;
    }

    const { data: insertedPlan, error: insertPlanError } = await supabase
      .from("meal_plans")
      .insert({
        child_id: nextChildId,
        plan_date: getMealPlanDateOnly(plan.createdAt),
        created_by_user_id: userId,
        created_at: plan.createdAt,
        updated_at: plan.createdAt,
        notices_json: plan.notices
        // TODO: persist generation_mode / allow_auto_supplement after migration apply
      })
      .select("id")
      .single<{ id: string }>();

    if (insertPlanError) {
      throw insertPlanError;
    }

    const mealPlanItems = buildMealPlanItemRows({
      mealPlanId: insertedPlan.id,
      plan
    });

    const { error: insertItemError } = await supabase.from("meal_plan_items").insert(mealPlanItems);

    if (insertItemError) {
      await supabase.from("meal_plans").delete().eq("id", insertedPlan.id);
      throw insertItemError;
    }

    const mealInputs = buildMealInputRows({
      mealPlanId: insertedPlan.id,
      childId: nextChildId,
      createdAt: plan.createdAt,
      plan,
      sourceMealInputs: plan.mealInputs
    });

    const { error: insertInputError } = await supabase.from("meal_inputs").insert(mealInputs);

    if (insertInputError) {
      await supabase.from("meal_plans").delete().eq("id", insertedPlan.id);
      throw insertInputError;
    }

    existingPlansByKey.set(`${nextChildId}:${plan.createdAt}`, insertedPlan.id);
  }

  const remappedDrafts: Record<string, MealDraft> = {};

  for (const [legacyChildId, draft] of sortDraftEntries(Object.entries(localDrafts))) {
    const nextChildId = childIdMap.get(legacyChildId);

    if (!nextChildId || remappedDrafts[nextChildId]) {
      continue;
    }

    remappedDrafts[nextChildId] = draft;
  }

  writeJson(DRAFT_STORAGE_KEY, remappedDrafts);

  setSelectedChildId(childIdMap.get(getSelectedChildId()) ?? "");

  removeValue(LEGACY_CHILDREN_STORAGE_KEY);
  removeValue(LEGACY_MEAL_PLANS_STORAGE_KEY);
  localStorage.setItem(MIGRATION_STATE_KEY, "done");
}

export async function ensureSupabaseSession() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  if (ensureSessionPromise) {
    return ensureSessionPromise;
  }

  ensureSessionPromise = (async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (data.session) {
      return data.session;
    }

    const anonymousSignIn = await supabase.auth.signInAnonymously();

    if (anonymousSignIn.error) {
      throw anonymousSignIn.error;
    }

    return anonymousSignIn.data.session;
  })();

  try {
    return await ensureSessionPromise;
  } finally {
    ensureSessionPromise = null;
  }
}

export async function getSupabaseCurrentUserId() {
  const session = await ensureSupabaseSession();
  return session?.user.id ?? null;
}

export async function ensureSupabasePersistenceReady() {
  const supabase = getSupabaseClient();

  if (!supabase || hasBootstrappedPersistence) {
    return;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const session = await ensureSupabaseSession();

    if (!session?.user.id || !isUuid(session.user.id)) {
      return;
    }

    await migrateLocalDataToSupabase(session.user.id);
    hasBootstrappedPersistence = true;
  })();

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

export function subscribeToSupabaseAuthState(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  return supabase.auth.onAuthStateChange(callback);
}
