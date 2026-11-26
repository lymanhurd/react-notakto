/**
 * Normal-play Nim, explained the way the strategy packet teaches it:
 * split each row into power-of-two clusters, tally each cluster size
 * across the board, and hand your opponent a board where every tally is even.
 *
 * (Under the hood "every tally is even" is the same as nim-sum === 0,
 * but nothing in the UI needs to mention binary.)
 */

import { isBalanced } from '../shared/balance';

export { CLUSTER_SIZES, clusters, isBalanced, oddSizes, tally } from '../shared/balance';

/** A board is just the number of stones left in each row. */
export type Rows = number[];

export interface Move {
  /** 0-based row index. */
  row: number;
  /** How many stones to take (at least 1). */
  take: number;
}

/** Largest number of stones allowed in one row (keeps clusters to 8, 4, 2, 1). */
export const MAX_ROW = 15;
/** Most rows on a board. */
export const MAX_ROWS = 6;

export interface Preset {
  rows: Rows;
  label: string;
}

/** Starting boards for Misère Nim: small endgames first, where the misère twist shows. */
export const MISERE_PRESETS: Preset[] = [
  { rows: [3, 4, 5], label: 'Sample board' },
  { rows: [1, 1, 1], label: 'Three singles' },
  { rows: [2, 2], label: 'Two pairs' },
  { rows: [1, 1, 3], label: 'The twist' },
  { rows: [2, 3, 4], label: 'Walkthrough' },
  { rows: [5, 6, 7], label: 'Game 2' },
  { rows: [4, 6, 7], label: 'Boss challenge' },
];

/** Starting boards from the strategy packet. */
export const PRESETS: Preset[] = [
  { rows: [3, 4, 5], label: 'Sample board' },
  { rows: [5, 5], label: 'Copycat' },
  { rows: [4, 7], label: 'Steal the copycat' },
  { rows: [2, 3, 4], label: 'Walkthrough' },
  { rows: [5, 6, 7], label: 'Game 2' },
  { rows: [2, 4, 6], label: 'Game 3' },
  { rows: [4, 6, 7], label: 'Boss challenge' },
];

export function totalStones(rows: Rows): number {
  return rows.reduce((a, b) => a + b, 0);
}

export function isGameOver(rows: Rows): boolean {
  return totalStones(rows) === 0;
}

export function applyMove(rows: Rows, move: Move): Rows {
  const { row, take } = move;
  if (row < 0 || row >= rows.length || take < 1 || take > rows[row]) {
    throw new Error(`Illegal move: take ${take} from row ${row + 1}`);
  }
  return rows.map((n, i) => (i === row ? n - take : n));
}

/**
 * Misère play: whoever takes the last stone LOSES.
 *
 * The strategy is almost the same as normal Nim. A position is safe to hand over when:
 * - some row still has 2 or more stones, and the board is Balanced (as in normal Nim), or
 * - every row has at most 1 stone, and there is an ODD number of single stones
 *   (so your opponent is the one left to take the last stone).
 * In practice: play normal Nim until your move would leave only rows of 0 or 1 stones;
 * then leave an odd number of single stones instead of an even number.
 */
export function isMisereSafe(rows: Rows): boolean {
  if (rows.some(n => n >= 2)) return isBalanced(rows);
  return rows.filter(n => n === 1).length % 2 === 1;
}

/** True when only rows of 0 or 1 stones are left (the misère endgame). */
export function onlySingles(rows: Rows): boolean {
  return rows.every(n => n <= 1);
}

/** Is `rows` a safe board to hand your opponent, under normal or misère play? */
export function isSafe(rows: Rows, misere = false): boolean {
  return misere ? isMisereSafe(rows) : isBalanced(rows);
}

/**
 * Every move that leaves a safe board (Balanced, in normal play). Empty when the
 * board is already safe (any move from a safe board makes it unsafe).
 */
export function winningMoves(rows: Rows, misere = false): Move[] {
  const moves: Move[] = [];
  rows.forEach((n, row) => {
    for (let take = 1; take <= n; take++) {
      if (isSafe(applyMove(rows, { row, take }), misere)) moves.push({ row, take });
    }
  });
  return moves;
}

/**
 * The computer: plays a winning move when one exists. From a safe board it
 * takes a single stone from a random non-empty row, leaving the board complex
 * so the player has the most chances to slip up (as the packet suggests).
 */
export function computerMove(rows: Rows, random: () => number = Math.random, misere = false): Move | null {
  if (isGameOver(rows)) return null;
  const wins = winningMoves(rows, misere);
  if (wins.length > 0) return wins[Math.floor(random() * wins.length)];
  const nonEmpty = rows.map((n, i) => (n > 0 ? i : -1)).filter(i => i >= 0);
  return { row: nonEmpty[Math.floor(random() * nonEmpty.length)], take: 1 };
}

/**
 * Parse a custom board like "3, 4, 5". Returns null if it isn't
 * 1–MAX_ROWS rows of 1–MAX_ROW stones.
 */
export function parseRows(text: string): Rows | null {
  const parts = text.split(/[\s,;()]+/).filter(Boolean);
  if (parts.length < 1 || parts.length > MAX_ROWS) return null;
  const rows = parts.map(p => Number(p));
  if (rows.some(n => !Number.isInteger(n) || n < 1 || n > MAX_ROW)) return null;
  return rows;
}

/** A random 3-row board with 1–9 stones per row. */
export function randomRows(random: () => number = Math.random): Rows {
  return [0, 1, 2].map(() => 1 + Math.floor(random() * 9));
}
