/** Read a JSON value from sessionStorage, falling back if missing or unavailable. */
export function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
}
