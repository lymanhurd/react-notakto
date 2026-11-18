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
 * Every move that leaves a Balanced board. Empty when the board is already
 * Balanced (any move from a Balanced board unbalances it).
 */
export function winningMoves(rows: Rows): Move[] {
  const moves: Move[] = [];
  rows.forEach((n, row) => {
    for (let take = 1; take <= n; take++) {
      if (isBalanced(applyMove(rows, { row, take }))) moves.push({ row, take });
    }
  });
  return moves;
}

/**
 * The computer: plays a balancing move when one exists. On a Balanced board it
 * takes a single stone from a random non-empty row, leaving the board complex
 * so the player has the most chances to slip up (as the packet suggests).
 */
export function computerMove(rows: Rows, random: () => number = Math.random): Move | null {
  if (isGameOver(rows)) return null;
  const wins = winningMoves(rows);
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
