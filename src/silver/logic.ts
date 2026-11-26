/**
 * John Conway's Silver Dollar Game.
 *
 * Coins sit on a strip of squares numbered from the star end (square 0).
 * A move slides one coin toward the star, any distance, without jumping over
 * or landing on another coin. Whoever makes the last move wins.
 *
 * Strategy (Nim in disguise): starting from the far end, call the coins
 * alternately "trailing" (silver) and "leading" (copper). Each trailing coin is
 * paired with the leading coin just ahead of it, and the number of empty squares
 * between them is a Nim pile. With an odd number of coins the last trailing coin
 * is paired with the star end of the strip.
 */
import { isBalanced } from '../shared/balance';

/** Coin positions (square indexes, 0 = star end), sorted ascending. */
export type Coins = number[];

export interface Move {
  /** Square the coin is on. */
  from: number;
  /** Square it slides to (closer to the star). */
  to: number;
}

export interface Pair {
  /** Position of the trailing (silver) coin. */
  trailing: number;
  /** Position of the leading (copper) coin, or null when paired with the star end. */
  leading: number | null;
  /** Empty squares between them: the Nim pile. */
  gap: number;
}

export const MIN_COINS = 1;
export const MAX_COINS = 8;
export const MAX_SQUARES = 20;

/** Pairs from the far end: (trailing, leading), …, and possibly (trailing, star). */
export function pairs(coins: Coins): Pair[] {
  const out: Pair[] = [];
  for (let t = coins.length - 1; t >= 0; t -= 2) {
    const trailing = coins[t];
    const leading = t > 0 ? coins[t - 1] : null;
    out.push({ trailing, leading, gap: trailing - (leading ?? -1) - 1 });
  }
  return out;
}

/** The Nim piles: one gap per pair. */
export function piles(coins: Coins): number[] {
  return pairs(coins).map(p => p.gap);
}

/** Every coin is packed against the star end, so nobody can move. */
export function isGameOver(coins: Coins): boolean {
  return coins.every((p, i) => p === i);
}

/** Squares a coin can slide to: anything between it and the next coin toward the star. */
export function destinations(coins: Coins, from: number): number[] {
  const i = coins.indexOf(from);
  if (i < 0) return [];
  const stop = i > 0 ? coins[i - 1] : -1;
  const out: number[] = [];
  for (let to = from - 1; to > stop; to--) out.push(to);
  return out;
}

export function legalMoves(coins: Coins): Move[] {
  return coins.flatMap(from => destinations(coins, from).map(to => ({ from, to })));
}

export function applyMove(coins: Coins, { from, to }: Move): Coins {
  if (!destinations(coins, from).includes(to)) {
    throw new Error(`Illegal move from square ${from + 1} to ${to + 1}`);
  }
  // Coins can't pass each other, so the order is unchanged.
  return coins.map(p => (p === from ? to : p));
}

/** Moves that leave a Balanced set of piles. */
export function winningMoves(coins: Coins): Move[] {
  return legalMoves(coins).filter(m => isBalanced(piles(applyMove(coins, m))));
}

/**
 * Perfect computer: balance the piles if possible. Otherwise slide a coin
 * just one square, which keeps the game long and gives the player chances.
 */
export function computerMove(coins: Coins, random: () => number = Math.random): Move | null {
  const wins = winningMoves(coins);
  if (wins.length > 0) return wins[Math.floor(random() * wins.length)];
  const small = legalMoves(coins).filter(m => m.from - m.to === 1);
  return small.length > 0 ? small[Math.floor(random() * small.length)] : null;
}

/** Fewest squares that fit `count` coins with an empty square in front of every coin. */
export function minSquares(count: number): number {
  return 2 * count;
}

/**
 * Random starting arrangement of `count` coins on `squares` squares with no empty gaps:
 * no coin sits right beside the star, and no two coins are side by side, so every coin
 * can move. All such arrangements are equally likely. Needs squares >= minSquares(count);
 * with fewer squares it places the coins at random without that guarantee.
 * (Positions set up by a link may still have empty gaps.)
 */
export function randomCoins(count: number, squares: number, random: () => number = Math.random): Coins {
  const shuffled = (n: number) => {
    const cells = Array.from({ length: n }, (_, i) => i);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
  };
  if (squares >= minSquares(count)) {
    // Choose `count` of the first squares - count slots, then spread them out:
    // the i-th coin moves i + 1 squares further, leaving a square in front of each coin.
    return shuffled(squares - count).slice(0, count).sort((a, b) => a - b).map((r, i) => r + i + 1);
  }
  if (squares <= count) return Array.from({ length: count }, (_, i) => i);
  for (;;) {
    const coins = shuffled(squares).slice(0, count).sort((a, b) => a - b);
    if (!isGameOver(coins)) return coins;
  }
}
