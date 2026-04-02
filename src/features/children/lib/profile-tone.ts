const PROFILE_TONES = ["sky", "butter", "mint", "peach"] as const;

const PROFILE_BACKGROUNDS: Record<ProfileTone, string> = {
  sky: "#B3D9FF",
  butter: "#FFE8B3",
  mint: "#D4E8D4",
  peach: "#FFD4C9"
};

export type ProfileTone = (typeof PROFILE_TONES)[number];

export function getProfileTone(seed: string) {
  const source = seed.trim() || "baby";
  const total = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PROFILE_TONES[total % PROFILE_TONES.length];
}

export function getProfileInitial(name: string) {
  return name.trim().slice(0, 1) || "아";
}

export function getProfileBackgroundColor(seed: string) {
  return PROFILE_BACKGROUNDS[getProfileTone(seed)];
}
