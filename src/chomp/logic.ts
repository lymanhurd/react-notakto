/**
 * Chomp: a chocolate bar with the poisoned square in the lower left corner.
 * A move bites one square and every square above it and to its right.
 * The poisoned square is nailed to the table, so whoever takes the last
 * other square wins (normal play).
 *
 * A board is stored as the length of each row, bottom row first, so the rows
 * never get longer going up. Columns and rows are 0-based from the poisoned
 * corner. The board keeps its row count; eaten rows have length 0.
 */

export type Board = number[];

export interface Bite {
  /** Row of the bitten square, 0 = bottom. */
  row: number;
  /** Column of the bitten square, 0 = left. */
  col: number;
}

/** Smallest board: one row of two squares (a 1 × 1 bar is only the poison). */
export const MIN_ROWS = 1;
export const MIN_COLS = 2;
/** Largest board offered: the search below stays quick up to this size. */
export const MAX_ROWS = 8;
export const MAX_COLS = 10;

export interface Size {
  rows: number;
  cols: number;
}

export interface Preset extends Size {
  label: string;
}

export const PRESETS: Preset[] = [
  { rows: 4, cols: 7, label: 'From the one-pager' },
  { rows: 5, cols: 5, label: 'Square board' },
  { rows: 2, cols: 6, label: 'Two rows' },
  { rows: 3, cols: 5, label: 'Three rows' },
  { rows: 6, cols: 9, label: 'Big bar' },
];

export function rectangle({ rows, cols }: Size): Board {
  return Array.from({ length: rows }, () => cols);
}

/** The poisoned square is all that's left: the player to move has lost. */
export function isGameOver(board: Board): boolean {
  return board[0] <= 1 && board.slice(1).every(n => n === 0);
}

export function hasSquare(board: Board, { row, col }: Bite): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[row];
}

export function isPoison({ row, col }: Bite): boolean {
  return row === 0 && col === 0;
}

export function isLegal(board: Board, bite: Bite): boolean {
  return hasSquare(board, bite) && !isPoison(bite);
}

/** Is square (row, col) eaten by `bite` (it's at or above and at or right of the bite)? */
export function inBite(bite: Bite | null, row: number, col: number): boolean {
  return bite !== null && row >= bite.row && col >= bite.col;
}

export function applyMove(board: Board, bite: Bite): Board {
  if (!isLegal(board, bite)) throw new Error(`Illegal bite at row ${bite.row + 1}, column ${bite.col + 1}`);
  return board.map((n, r) => (r >= bite.row ? Math.min(n, bite.col) : n));
}

/** How many squares a bite takes. */
export function biteSize(board: Board, bite: Bite): number {
  return board.reduce((sum, n, r) => sum + (r >= bite.row ? Math.max(0, n - bite.col) : 0), 0);
}

export function legalMoves(board: Board): Bite[] {
  const moves: Bite[] = [];
  board.forEach((n, row) => {
    for (let col = 0; col < n; col++) if (!isPoison({ row, col })) moves.push({ row, col });
  });
  return moves;
}

const key = (board: Board) => board.join(',');

/** Positions already solved: true when the player to move can win. */
const memo = new Map<string, boolean>();

/**
 * Can the player to move force a win? A position is a win if some bite
 * leaves the opponent a losing position. Memoized, so each shape of bar is
 * solved only once (an 8 × 10 bar has fewer than 44,000 shapes).
 */
export function isWinning(board: Board): boolean {
  const k = key(board);
  const known = memo.get(k);
  if (known !== undefined) return known;
  const result = !isGameOver(board) && legalMoves(board).some(m => !isWinning(applyMove(board, m)));
  memo.set(k, result);
  return result;
}

/** Bites that leave the opponent in a losing position. Empty if there are none. */
export function winningMoves(board: Board): Bite[] {
  return legalMoves(board).filter(m => !isWinning(applyMove(board, m)));
}

/** Single squares at an outside corner of the bar: biting one takes just that square. */
export function cornerSquares(board: Board): Bite[] {
  const corners: Bite[] = [];
  board.forEach((n, row) => {
    const above = row + 1 < board.length ? board[row + 1] : 0;
    if (n > 0 && above < n && !isPoison({ row, col: n - 1 })) corners.push({ row, col: n - 1 });
  });
  return corners;
}

/**
 * The computer: bites a winning square when there is one. Otherwise it nibbles
 * a single corner square, keeping the bar big so the player has more chances to slip.
 */
export function computerMove(board: Board, random: () => number = Math.random): Bite | null {
  if (isGameOver(board)) return null;
  const wins = winningMoves(board);
  const choices = wins.length > 0 ? wins : cornerSquares(board);
  return choices[Math.floor(random() * choices.length)];
}

/**
 * The position's label, as in the one-pager's lookup table: the length of
 * each remaining row from top to bottom, e.g. (3, 3, 7, 7).
 */
export function label(board: Board): string {
  return `(${board.filter(n => n > 0).reverse().join(', ')})`;
}

export function sizeLabel({ rows, cols }: Size): string {
  return `${rows} × ${cols}`;
}

export function clampSize({ rows, cols }: Size): Size {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));
  return { rows: clamp(rows, MIN_ROWS, MAX_ROWS), cols: clamp(cols, MIN_COLS, MAX_COLS) };
}

export function randomSize(random: () => number = Math.random): Size {
  return { rows: 2 + Math.floor(random() * 5), cols: 3 + Math.floor(random() * 6) };
}
