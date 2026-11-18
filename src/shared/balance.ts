/**
 * The "balance" idea from the Nim strategy packet, shared by every impartial game:
 * break each value into power-of-two clusters (8, 4, 2, 1), tally the clusters
 * across the board, and a position is Balanced when every tally is even.
 *
 * In Nim the values are the row sizes. In Grundy's Game and Kayles each group
 * of dots has a value from a table (its Grundy value), and the same rule applies.
 */

/** Cluster sizes the UI knows about, biggest first. */
export const CLUSTER_SIZES = [8, 4, 2, 1] as const;

/**
 * Greedy grouping rule: biggest power of two that fits, then the next, down to 1.
 * clusters(13) → [8, 4, 1]
 */
export function clusters(stones: number): number[] {
  const out: number[] = [];
  let left = stones;
  for (let size = 1 << 30; size >= 1; size >>= 1) {
    if (left >= size) {
      out.push(size);
      left -= size;
    }
  }
  return out;
}

/** How many clusters of each size are on the board, e.g. {4: 2, 2: 1, 1: 2}. */
export function tally(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const n of values) {
    for (const size of clusters(n)) {
      counts.set(size, (counts.get(size) ?? 0) + 1);
    }
  }
  return counts;
}

/** Cluster sizes whose board-wide tally is odd, biggest first. */
export function oddSizes(values: number[]): number[] {
  return [...tally(values).entries()]
    .filter(([, count]) => count % 2 === 1)
    .map(([size]) => size)
    .sort((a, b) => b - a);
}

/** Balanced = every cluster size appears an even number of times (0 counts as even). */
export function isBalanced(values: number[]): boolean {
  return oddSizes(values).length === 0;
}

/** XOR of all values: 0 exactly when the board is Balanced. */
export function nimSum(values: number[]): number {
  return values.reduce((a, b) => a ^ b, 0);
}

/** Minimum excluded value: the smallest non-negative integer not in `values`. */
export function mex(values: Iterable<number>): number {
  const seen = new Set(values);
  let m = 0;
  while (seen.has(m)) m++;
  return m;
}
