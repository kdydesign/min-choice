import type { ChildProfile } from "../../../types/domain";
import { readJson, writeJson } from "../../../services/storage/browser-storage";

const STORAGE_KEY = "min-baby-meals.profiles";

export async function listChildProfiles() {
  return readJson<ChildProfile[]>(STORAGE_KEY, []).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export async function saveChildProfile(profile: ChildProfile) {
  const profiles = await listChildProfiles();
  const nextProfiles = [...profiles];
  const index = nextProfiles.findIndex((item) => item.id === profile.id);

  if (index >= 0) {
    nextProfiles[index] = profile;
  } else {
    nextProfiles.unshift(profile);
  }

  writeJson(STORAGE_KEY, nextProfiles);
  return profile;
}

export async function deleteChildProfile(profileId: string) {
  const profiles = (await listChildProfiles()).filter((item) => item.id !== profileId);
  writeJson(STORAGE_KEY, profiles);
  return profileId;
}
