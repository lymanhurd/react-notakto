// Scores and settings are kept in localStorage so they survive closing the tab:
// a returning player sees their record instead of starting at 0–0.

/** Read a JSON value from localStorage, falling back if missing or unavailable. */
export function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
}
