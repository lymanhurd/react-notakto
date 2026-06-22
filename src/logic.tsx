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

/**
 * computerMove — picks a move for the computer.
 *
 * Strategy:
 * - Start from a random square to avoid always playing top-left.
 * - If the human is currently winning (isWinning), any legal move is
 *   acceptable — there is no winning response available.
 * - Otherwise, only accept a move that results in a winning position
 *   for the computer (isWinning after the move).
 *
 * Returns the updated boards array, or undefined if no legal move exists
 * (should not happen in normal play).
 */
export function computerMove(
  boards: BoardString[]
): BoardString[] | undefined {
  const numSquares = 9 * boards.length;
  const startingSquare = Math.floor(Math.random() * numSquares);

  // If the human is winning, any legal move is fine
  const findAvailable = isWinning(boards);

  for (let i = 0; i < numSquares; i++) {
    const square = (i + startingSquare) % numSquares;
    const idx = Math.floor(square / 9);

    if (isDead(boards[idx])) {
      continue;
    }

    const sqNum = square % 9;

    if (boards[idx][sqNum] === '-') {
      const test = mkMove(boards, idx, sqNum);

      if (findAvailable || isWinning(test)) {
        return test;
      }
    }
  }

  // Reaching here means either no open squares exist (should be caught
  // upstream) or the monoid evaluation is inconsistent (mathematically
  // impossible under correct game logic).
  console.error('Monoid Error: computerMove found no valid move.');
  return undefined;
}
