interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let cachedSupabaseConfig: SupabaseConfig | null | undefined;
let hasWarnedAboutSupabaseConfig = false;

function normalizeEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function warnAboutSupabaseConfig(message: string) {
  if (hasWarnedAboutSupabaseConfig) {
    return;
  }

  hasWarnedAboutSupabaseConfig = true;
  console.warn(message);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  if (cachedSupabaseConfig !== undefined) {
    return cachedSupabaseConfig;
  }

  const url = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!url && !anonKey) {
    cachedSupabaseConfig = null;
    return cachedSupabaseConfig;
  }

  if (!url || !anonKey) {
    warnAboutSupabaseConfig(
      "Supabase env is partially configured. Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
    cachedSupabaseConfig = null;
    return cachedSupabaseConfig;
  }

  if (!isValidUrl(url)) {
    warnAboutSupabaseConfig("VITE_SUPABASE_URL must be a valid absolute URL.");
    cachedSupabaseConfig = null;
    return cachedSupabaseConfig;
  }

  cachedSupabaseConfig = {
    url,
    anonKey
  };

  return cachedSupabaseConfig;
}

export function hasSupabaseConfig() {
  return getSupabaseConfig() !== null;
}
