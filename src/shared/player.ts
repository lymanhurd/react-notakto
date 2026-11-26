// The player's name, kept only in this browser's localStorage so the front page can
// welcome them back. It is never sent anywhere (not to analytics, not to a server).

const NAME_KEY = 'playerName';
const DECLINED_KEY = 'playerNameDeclined';

/** Longest name we keep. */
export const MAX_NAME = 20;

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

export interface GameRecord {
  wins: number;
  /** Wins with no Hint and no helper views. */
  cleanWins: number;
  losses: number;
}

const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/**
 * A game's record on this device, from its stats key. NoTakTo keeps its score
 * inside its saved game ("notaktoSession"); the others store it directly.
 */
export function readRecord(statsKey: string): GameRecord {
  try {
    const raw = read(statsKey);
    const saved = raw ? JSON.parse(raw) : {};
    const stats = (statsKey === 'notaktoSession' ? saved?.stats : saved) ?? {};
    const wins = count(stats.humanWins);
    return { wins, cleanWins: Math.min(wins, count(stats.cleanWins)), losses: count(stats.computerWins) };
  } catch {
    return { wins: 0, cleanWins: 0, losses: 0 };
  }
}

/** Games won against the computer, across every game, on this device. */
export function totalWins(statsKeys: string[]): number {
  return statsKeys.reduce((sum, key) => sum + readRecord(key).wins, 0);
}

/** Remove everything this site has saved in this browser: name, scores, settings, saved games. */
export function clearEverything(): void {
  try {
    localStorage.clear();
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/** The player's side of the scoreboard: their name if they gave one. */
export const scoreLabel = (name: string | null) => name ?? 'Human';

/** Headline when the player wins: "You won, Ada!" or "You won!". */
export const youWon = (name: string | null) => (name ? `You won, ${name}!` : 'You won!');
