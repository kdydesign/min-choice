import { createId } from "../../../lib/create-id";
import { isUuid } from "../../../lib/is-uuid";
import { getSupabaseClient } from "../../../lib/supabase";
import type { ChildProfile } from "../../../types/domain";
import {
  ensureSupabasePersistenceReady,
  getSupabaseCurrentUserId
} from "../../auth/api/supabase-bootstrap-service";

interface ChildProfileRow {
  id: string;
  name: string;
  age_months: number | null;
  birth_date: string | null;
  allergies_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface SaveChildProfileInput {
  id?: string;
  name: string;
  ageMonths: number;
  birthDate: string;
  allergies: string[];
  createdAt?: string;
  updatedAt?: string;
}

function sortProfiles(profiles: ChildProfile[]) {
  return [...profiles].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeProfileInput(profile: SaveChildProfileInput): ChildProfile {
  const now = new Date().toISOString();

  return {
    id: profile.id && profile.id.trim() ? profile.id : createId("child"),
    name: profile.name.trim(),
    ageMonths: profile.ageMonths,
    birthDate: profile.birthDate,
    allergies: [...new Set(profile.allergies.map((item) => item.trim()).filter(Boolean))],
    createdAt: profile.createdAt ?? now,
    updatedAt: profile.updatedAt ?? now
  };
}

function mapChildProfileRow(row: ChildProfileRow): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    ageMonths: row.age_months ?? 12,
    birthDate: row.birth_date ?? "",
    allergies: parseStringArray(row.allergies_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireChildProfileContext() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 연결이 없어 아이 프로필을 불러올 수 없어요.");
  }

  await ensureSupabasePersistenceReady();

  const userId = await getSupabaseCurrentUserId();

  if (!userId) {
    throw new Error("Supabase 세션을 준비하지 못해 아이 프로필을 처리할 수 없어요.");
  }

  return { supabase, userId };
}

export async function listChildProfiles() {
  const { supabase, userId } = await requireChildProfileContext();
  const { data, error } = await supabase
    .from("children")
    .select("id, name, age_months, birth_date, allergies_json, created_at, updated_at")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return sortProfiles((data ?? []).map((row) => mapChildProfileRow(row as ChildProfileRow)));
}

export async function saveChildProfile(input: SaveChildProfileInput) {
  const { supabase, userId } = await requireChildProfileContext();
  const normalizedProfile = normalizeProfileInput(input);
  const payload = {
    owner_user_id: userId,
    name: normalizedProfile.name,
    birth_date: normalizedProfile.birthDate || null,
    age_months: normalizedProfile.ageMonths,
    allergies_json: normalizedProfile.allergies,
    created_at: normalizedProfile.createdAt,
    updated_at: normalizedProfile.updatedAt
  };

  const operation = isUuid(normalizedProfile.id)
    ? supabase
        .from("children")
        .update(payload)
        .eq("id", normalizedProfile.id)
        .eq("owner_user_id", userId)
        .select("id, name, age_months, birth_date, allergies_json, created_at, updated_at")
        .single()
    : supabase
        .from("children")
        .insert(payload)
        .select("id, name, age_months, birth_date, allergies_json, created_at, updated_at")
        .single();

  const { data, error } = await operation;

  if (error) {
    throw error;
  }

  return mapChildProfileRow(data as ChildProfileRow);
}

export async function deleteChildProfile(profileId: string) {
  if (!isUuid(profileId)) {
    throw new Error("삭제할 아이 프로필 ID가 올바르지 않아요.");
  }

  const { supabase, userId } = await requireChildProfileContext();
  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", profileId)
    .eq("owner_user_id", userId);

  if (error) {
    throw error;
  }

  return profileId;
}
