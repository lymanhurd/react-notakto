/**
 * The Daily Challenge: one "find the winning move" puzzle per day, the same for
 * everyone, built from the date (no server). Puzzles rotate through Nim,
 * Wythoff's Nim and Misère Nim. Solving on consecutive days builds a streak,
 * which is saved in this browser's localStorage only. Weekends never break a
 * streak, though solving on a weekend still extends it.
 */

import { isBalanced, isMisereSafe } from '../nim/logic';
import { isP } from '../wythoff/logic';
import { load } from '../shared/storage';

export type Kind = 'nim' | 'wythoff' | 'misere';

export interface Puzzle {
  /** Local date, "YYYY-MM-DD". */
  date: string;
  /** Daily Challenge number (#1 was November 26, 2026). */
  number: number;
  kind: Kind;
  /** Stones in each row (Wythoff's Nim: pile A, pile B). */
  rows: number[];
}

/** Take `take` stones from `row`, or (Wythoff's Nim) the same number from both piles. */
export interface DailyMove {
  row: number;
  take: number;
  both: boolean;
}

export const KIND_INFO: Record<Kind, { title: string; href: string; rules: string }> = {
  nim: {
    title: 'Nim',
    href: '/nim/',
    rules: 'Take any number of stones from one row. Whoever takes the last stone wins.',
  },
  wythoff: {
    title: "Wythoff's Nim",
    href: '/wythoff/',
    rules: 'Take any number of stones from one pile, or the same number from both. Whoever takes the last stone wins.',
  },
  misere: {
    title: 'Misère Nim',
    href: '/misere-nim/',
    rules: 'Take any number of stones from one row. Whoever takes the last stone loses.',
  },
};

const FIRST_DAY = '2026-11-26';
const KINDS: Kind[] = ['nim', 'wythoff', 'misere'];

// ---- Dates (local time) ------------------------------------------

/** "YYYY-MM-DD" for a date in the player's own time zone. */
export function dateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `a` to `b` (both "YYYY-MM-DD"). */
export function daysBetween(a: string, b: string): number {
  const utc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  const pad = (k: number) => String(k).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// ---- Puzzles -------------------------------------------------------

/** Small seeded random number generator (mulberry32), so a date always gives the same puzzle. */
function seeded(seedText: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** After a move, is the position one the mover can win from (the opponent is stuck)? */
export function isWin(kind: Kind, rows: number[]): boolean {
  if (kind === 'wythoff') return isP({ a: rows[0], b: rows[1] });
  if (kind === 'misere') return rows.some(n => n > 0) ? isMisereSafe(rows) : false;
  return isBalanced(rows);
}

export function applyDailyMove(rows: number[], { row, take, both }: DailyMove): number[] {
  return both ? rows.map(n => n - take) : rows.map((n, i) => (i === row ? n - take : n));
}

export function legalMoves(kind: Kind, rows: number[]): DailyMove[] {
  const moves: DailyMove[] = [];
  rows.forEach((n, row) => {
    for (let take = 1; take <= n; take++) moves.push({ row, take, both: false });
  });
  if (kind === 'wythoff') {
    for (let take = 1; take <= Math.min(...rows); take++) moves.push({ row: 0, take, both: true });
  }
  return moves;
}

/** Every move that solves the puzzle. */
export function winningMoves(kind: Kind, rows: number[]): DailyMove[] {
  return legalMoves(kind, rows).filter(m => isWin(kind, applyDailyMove(rows, m)));
}

export function puzzleFor(date: string): Puzzle {
  const number = daysBetween(FIRST_DAY, date) + 1;
  const kind = KINDS[((number - 1) % KINDS.length + KINDS.length) % KINDS.length];
  const random = seeded(`daily:${date}`);
  const int = (lo: number, hi: number) => lo + Math.floor(random() * (hi - lo + 1));
  for (;;) {
    let rows: number[];
    if (kind === 'wythoff') {
      rows = [int(4, 15), int(4, 15)];
    } else if (kind === 'misere' && random() < 0.4) {
      // The misère endgame: single stones plus one bigger row.
      rows = [...Array.from({ length: int(1, 3) }, () => 1), int(2, 9)];
    } else {
      rows = Array.from({ length: int(3, 4) }, () => int(1, 11));
    }
    if (winningMoves(kind, rows).length > 0) return { date, number, kind, rows };
  }
}

export function describeMove(kind: Kind, { row, take, both }: DailyMove): string {
  const stones = take === 1 ? '1 stone' : `${take} stones`;
  if (both) return `take ${stones} from both piles`;
  return kind === 'wythoff' ? `take ${stones} from pile ${row === 0 ? 'A' : 'B'}` : `take ${stones} from row ${row + 1}`;
}

// ---- Streak record ---------------------------------------------------

/** localStorage key for the player's Daily Challenge record. */
export const DAILY_KEY = 'dailyChallenge';

export interface DayResult {
  tries: number;
  solved: boolean;
  /** The answer was shown before solving, so the day doesn't count. */
  revealed: boolean;
}

export interface DailyRecord {
  days: Record<string, DayResult>;
  streak: number;
  best: number;
  /** The last day solved, "YYYY-MM-DD". */
  lastSolved: string | null;
}

export const EMPTY_RECORD: DailyRecord = { days: {}, streak: 0, best: 0, lastSolved: null };

/** Saturday or Sunday. */
export function isWeekend(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Does a streak that reached `from` carry on to `to`? Only if every day in between
 * is a weekend day: weekends never break a streak, but solving on one still adds to it.
 */
export function bridges(from: string, to: string): boolean {
  const gap = daysBetween(from, to);
  if (gap < 1) return false;
  for (let i = 1; i < gap; i++) if (!isWeekend(addDays(from, i))) return false;
  return true;
}

/** Streak as of `today`: it lapses once a weekday passes without a solve. */
export function currentStreak(record: DailyRecord, today: string): number {
  if (!record.lastSolved) return 0;
  return record.lastSolved === today || bridges(record.lastSolved, today) ? record.streak : 0;
}

/**
 * Work out the streak, best streak and last solved day from the days played.
 * Neither the streak nor the best ever goes down, so numbers saved under the
 * older rules (where a weekend broke a streak) are kept.
 */
export function recount(record: DailyRecord): DailyRecord {
  const solved = Object.keys(record.days).filter(d => record.days[d].solved).sort();
  let streak = 0;
  let best = record.best;
  let last: string | null = null;
  for (const date of solved) {
    streak = last !== null && bridges(last, date) ? streak + 1 : 1;
    // Keep the streak that was saved for its last day, if it was longer.
    if (date === record.lastSolved) streak = Math.max(streak, record.streak);
    best = Math.max(best, streak);
    last = date;
  }
  return { days: record.days, streak, best, lastSolved: last };
}

/** The saved record, recounted so streaks follow the current rules. */
export function loadDaily(): DailyRecord {
  return recount(load(DAILY_KEY, EMPTY_RECORD));
}

const dayOf = (record: DailyRecord, date: string): DayResult =>
  record.days[date] ?? { tries: 0, solved: false, revealed: false };

/** Record a try on `date`'s puzzle; `correct` says whether it solved it. */
export function recordTry(record: DailyRecord, date: string, correct: boolean): DailyRecord {
  const day = dayOf(record, date);
  if (day.solved || day.revealed) return record;
  const next: DayResult = { ...day, tries: day.tries + 1, solved: correct };
  const days = { ...record.days, [date]: next };
  return correct ? recount({ ...record, days }) : { ...record, days };
}

/** The player asked to see the answer: the day no longer counts toward the streak. */
export function recordReveal(record: DailyRecord, date: string): DailyRecord {
  const day = dayOf(record, date);
  if (day.solved) return record;
  return { ...record, days: { ...record.days, [date]: { ...day, revealed: true } } };
}

export function dayResult(record: DailyRecord, date: string): DayResult {
  return dayOf(record, date);
}
