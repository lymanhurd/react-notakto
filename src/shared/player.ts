// The player's name, kept only in this browser's localStorage so the front page can
// welcome them back. It is never sent anywhere (not to analytics, not to a server).

const NAME_KEY = 'playerName';
const DECLINED_KEY = 'playerNameDeclined';

/** Longest name we keep. */
export const MAX_NAME = 20;

/** Stats keys used by the games (NoTakTo keeps its stats inside its saved game). */
const STATS_KEYS = [
  'nimStats', 'misereNimStats', 'silverStats', 'wythoffStats',
  'kaylesStats', 'grundyStats', 'chompStats',
];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the site still works.
  }
}

/** Tidy a typed name: no control characters, single spaces, at most MAX_NAME characters. */
export function cleanName(raw: string): string {
  return [...raw.replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim()].slice(0, MAX_NAME).join('').trim();
}

export function getName(): string | null {
  const name = cleanName(read(NAME_KEY) ?? '');
  return name || null;
}

export function setName(raw: string): string | null {
  const name = cleanName(raw);
  write(NAME_KEY, name || null);
  if (name) write(DECLINED_KEY, null);
  return name || null;
}

export function forgetName(): void {
  write(NAME_KEY, null);
}

/** The player chose "No thanks", so don't ask again. */
export function hasDeclined(): boolean {
  return read(DECLINED_KEY) === 'true';
}

export function decline(): void {
  write(DECLINED_KEY, 'true');
}

/** Games won against the computer, across every game, on this device. */
export function totalWins(): number {
  const wins = (raw: string | null, pick: (o: Record<string, unknown>) => unknown) => {
    try {
      const n = raw ? pick(JSON.parse(raw)) : 0;
      return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  };
  const games = STATS_KEYS.reduce((sum, k) => sum + wins(read(k), o => o.humanWins), 0);
  const notakto = wins(read('notaktoSession'), o => (o.stats as Record<string, unknown> | undefined)?.humanWins);
  return games + notakto;
}

/** Remove everything this site has saved in this browser: name, scores, settings, saved games. */
export function clearEverything(): void {
  try {
    localStorage.clear();
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
