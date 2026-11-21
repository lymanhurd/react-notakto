import { isWinning } from './monoid';

// ─── Types ────────────────────────────────────────────────────────────────────


export type { Cell, BoardString } from './types/game';
import type { BoardString } from './types/game';
// ─── Constants ────────────────────────────────────────────────────────────────

const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * mkMove — returns a new boards array with the given square marked.
 * Previous move marker 'x' is uppercased to 'X'; new square is 'x'.
 * Pure function — does not mutate the input array.
 */
function mkMove(
  boards: BoardString[],
  idx: number,
  squareNum: number
): BoardString[] {
  return boards.map((b, i) =>
    i === idx
      ? b.substring(0, squareNum).toUpperCase() +
        'x' +
        b.substring(squareNum + 1).toUpperCase()
      : b.toUpperCase()
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * isDead — returns true if a board has a three-in-a-row
 * (horizontal, vertical, or diagonal).
 */
export function isDead(board: BoardString): boolean {
  for (const [a, b, c] of WINNING_LINES) {
    if (
      board.charAt(a) !== '-' &&
      board.charAt(b) !== '-' &&
      board.charAt(c) !== '-'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * isStart — returns true if every board is in its initial empty state.
 */
export function isStart(boards: BoardString[]): boolean {
  return boards.every((b) => b === '---------');
}

/**
 * isGameOver — returns true if every board is dead.
 */
export function isGameOver(boards: BoardString[]): boolean {
  return boards.every((b) => isDead(b));
}

/**
 * humanMove — attempts to place a mark at the given square.
 * Returns the updated boards array, or null if the move is illegal
 * (square already occupied, or board is dead).
 */
export function humanMove(
  boards: BoardString[],
  idx: number,
  squareNum: number
): BoardString[] | null {
  if (boards[idx][squareNum] !== '-' || isDead(boards[idx])) {
    return null;
  }
  return mkMove(boards, idx, squareNum);
}

/** A square on one board: `board` is the board's index, `square` is 0–8 (row by row). */
export interface SquareRef {
  board: number;
  square: number;
}

/**
 * winningMoves — every move that leaves a winning position for the player
 * making it (so the opponent can't win against perfect play). Moves that kill
 * the last board lose, so they are never included. Empty when no winning move exists.
 */
export function winningMoves(boards: BoardString[]): SquareRef[] {
  const moves: SquareRef[] = [];
  boards.forEach((b, board) => {
    if (isDead(b)) return;
    for (let square = 0; square < 9; square++) {
      if (b[square] !== '-') continue;
      const next = mkMove(boards, board, square);
      if (!isGameOver(next) && isWinning(next)) moves.push({ board, square });
    }
  });
  return moves;
}

/**
 * computerMove — picks a move for the computer.
 *
 * Strategy:
 * - If a winning move exists, play one (chosen at random).
 * - Otherwise the human is winning with perfect play, so the computer tries
 *   to make the game as long and tricky as possible: it picks a random move
 *   that does not kill a board, and only kills a board when every legal move
 *   would do so.
 *
 * Returns the updated boards array, or undefined if no legal move exists
 * (should not happen in normal play).
 */
export function computerMove(
  boards: BoardString[]
): BoardString[] | undefined {
  const winning: BoardString[][] = [];
  const safe: BoardString[][] = [];
  const killing: BoardString[][] = [];

  boards.forEach((b, idx) => {
    if (isDead(b)) return;
    for (let sqNum = 0; sqNum < 9; sqNum++) {
      if (b[sqNum] !== '-') continue;
      const test = mkMove(boards, idx, sqNum);
      if (!isGameOver(test) && isWinning(test)) winning.push(test);
      else if (isDead(test[idx])) killing.push(test);
      else safe.push(test);
    }
  });

  const pool = winning.length > 0 ? winning : safe.length > 0 ? safe : killing;
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  console.error('computerMove found no legal move.');
  return undefined;
}
