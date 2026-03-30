export function readJson<T>(key: string, fallback: T) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Failed to read browser storage key: ${key}`, error);
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeValue(key: string) {
  localStorage.removeItem(key);
}
