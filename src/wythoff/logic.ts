/**
 * Wythoff's Nim: two piles of stones. On your turn take any number of stones
 * from one pile, or the same number from both. Whoever takes the last stone wins.
 *
 * The same game on a grid: a marker sits on square (a, b), where a is the size
 * of pile A (the column) and b is the size of pile B (the row). A move slides it
 * left, down, or diagonally down-left. Whoever reaches (0, 0) wins.
 */

/** A position: the sizes of pile A (column) and pile B (row). */
export interface Pos {
  a: number;
  b: number;
}

/** A move is named by where it lands. */
export type Move = Pos;

/** Largest pile, so the grid runs 0–15 in each direction. */
export const MAX_PILE = 15;
/** Number of squares along each side of the grid. */
export const GRID = MAX_PILE + 1;

export const PHI = (1 + Math.sqrt(5)) / 2;

export const key = (p: Pos) => `${p.a},${p.b}`;
export const samePos = (p: Pos | null, q: Pos | null) =>
  p !== null && q !== null && p.a === q.a && p.b === q.b;

export function isGameOver(p: Pos): boolean {
  return p.a === 0 && p.b === 0;
}

/** True when `to` can be reached from `from` in one move. */
export function isLegal(from: Pos, to: Pos): boolean {
  const da = from.a - to.a;
  const db = from.b - to.b;
  if (to.a < 0 || to.b < 0 || da < 0 || db < 0 || (da === 0 && db === 0)) return false;
  return da === 0 || db === 0 || da === db;
}

export function applyMove(from: Pos, to: Move): Pos {
  if (!isLegal(from, to)) throw new Error(`Illegal move from (${from.a}, ${from.b}) to (${to.a}, ${to.b})`);
  return { a: to.a, b: to.b };
}

/** Every square reachable in one move. */
export function moves(p: Pos): Pos[] {
  const out: Pos[] = [];
  for (let a = p.a - 1; a >= 0; a--) out.push({ a, b: p.b });
  for (let b = p.b - 1; b >= 0; b--) out.push({ a: p.a, b });
  for (let t = 1; t <= Math.min(p.a, p.b); t++) out.push({ a: p.a - t, b: p.b - t });
  return out;
}

/**
 * The k-th safe pair (k = 0, 1, 2, …): (⌊kφ⌋, ⌊kφ⌋ + k).
 * These are (0,0), (1,2), (3,5), (4,7), (6,10), (8,13), (9,15), …
 */
export function safePair(k: number): [number, number] {
  const a = Math.floor(k * PHI);
  return [a, a + k];
}

/** A 𝒫 position ("previous player wins"): whoever hands it over wins. */
export function isP(p: Pos): boolean {
  const lo = Math.min(p.a, p.b);
  const hi = Math.max(p.a, p.b);
  const [a, b] = safePair(hi - lo);
  return lo === a && hi === b;
}

/** All 𝒫 squares on a grid with `size` squares per side. */
export function pSquares(size = GRID): Pos[] {
  const out: Pos[] = [];
  for (let k = 0; ; k++) {
    const [a, b] = safePair(k);
    if (a >= size) break;
    if (b < size) {
      out.push({ a, b });
      if (k > 0) out.push({ a: b, b: a });
    }
  }
  return out;
}

/** Moves that hand the opponent a 𝒫 square. Empty when already on one. */
export function winningMoves(p: Pos): Pos[] {
  return moves(p).filter(isP);
}

/**
 * The computer: moves to a 𝒫 square when it can. From a 𝒫 square it takes one
 * stone from a random non-empty pile, keeping the position complicated.
 */
export function computerMove(p: Pos, random: () => number = Math.random): Move | null {
  if (isGameOver(p)) return null;
  const wins = winningMoves(p);
  if (wins.length > 0) return wins[Math.floor(random() * wins.length)];
  const options: Pos[] = [];
  if (p.a > 0) options.push({ a: p.a - 1, b: p.b });
  if (p.b > 0) options.push({ a: p.a, b: p.b - 1 });
  return options[Math.floor(random() * options.length)];
}

/** Describe a move in terms of the piles. */
export function describeMove(from: Pos, to: Pos): string {
  const da = from.a - to.a;
  const db = from.b - to.b;
  const n = (k: number) => (k === 1 ? '1 stone' : `${k} stones`);
  if (da > 0 && db > 0) return `take ${n(da)} from both piles`;
  if (da > 0) return `take ${n(da)} from pile A`;
  return `take ${n(db)} from pile B`;
}

export type Mark = 'P' | 'N';

/** One round of the marking procedure: a new 𝒫 square and the 𝒩 squares it creates. */
export interface BuildStep {
  p: Pos;
  newN: Pos[];
}

/**
 * Find the 𝒫 squares by the marking procedure, one 𝒫 square per step.
 * Scan the grid row by row from the bottom-left. The first blank square can't
 * reach a 𝒫 square (otherwise it would already be marked 𝒩), so it is 𝒫. Then
 * every square to its right, above it, and diagonally up-right becomes 𝒩.
 */
export function constructionSteps(size = GRID): BuildStep[] {
  const marks = new Map<string, Mark>();
  const steps: BuildStep[] = [];
  for (let b = 0; b < size; b++) {
    for (let a = 0; a < size; a++) {
      if (marks.has(key({ a, b }))) continue;
      marks.set(key({ a, b }), 'P');
      const newN: Pos[] = [];
      const markN = (q: Pos) => {
        if (q.a < size && q.b < size && !marks.has(key(q))) {
          marks.set(key(q), 'N');
          newN.push(q);
        }
      };
      for (let t = 1; t < size; t++) {
        markN({ a: a + t, b });
        markN({ a, b: b + t });
        markN({ a: a + t, b: b + t });
      }
      steps.push({ p: { a, b }, newN });
    }
  }
  return steps;
}

/** The marks after the first `count` steps of the procedure. */
export function marksAfter(steps: BuildStep[], count: number): Map<string, Mark> {
  const marks = new Map<string, Mark>();
  for (const step of steps.slice(0, count)) {
    marks.set(key(step.p), 'P');
    for (const q of step.newN) marks.set(key(q), 'N');
  }
  return marks;
}

/** A random start, never (0, 0) and never on an edge (so it isn't a one-move win). */
export function randomStart(random: () => number = Math.random): Pos {
  const pick = () => 3 + Math.floor(random() * (MAX_PILE - 2));
  return { a: pick(), b: pick() };
}
