/**
 * Grundy's Game: a row of dots is split into groups. A move splits one group
 * into two groups of DIFFERENT sizes. Groups of 1 or 2 can't be split.
 * Whoever makes the last move wins.
 *
 * Each group of n dots acts like a Nim row whose size is grundyValue(n), so the
 * winning strategy is the packet's: leave a Balanced set of values.
 */
import { isBalanced, mex } from '../shared/balance';

/** Group sizes, in order along the line of dots. */
export type Groups = number[];

export interface Split {
  /** Which group (0-based). */
  group: number;
  /** Size of the left-hand piece; the right-hand piece gets the rest. */
  left: number;
}

export const MIN_DOTS = 3;
export const MAX_DOTS = 24;

const values: number[] = [0, 0, 0]; // sizes 0, 1, 2 can't be split

/** Grundy value of one group: mex of the values reachable by one unequal split. */
export function grundyValue(n: number): number {
  for (let size = values.length; size <= n; size++) {
    const reachable: number[] = [];
    for (let a = 1; 2 * a < size; a++) reachable.push(values[a] ^ values[size - a]);
    values[size] = mex(reachable);
  }
  return values[n];
}

export function groupValues(groups: Groups): number[] {
  return groups.map(grundyValue);
}

export function canSplit(n: number, left: number): boolean {
  return left >= 1 && left < n && 2 * left !== n;
}

export function applySplit(groups: Groups, { group, left }: Split): Groups {
  const n = groups[group];
  if (n === undefined || !canSplit(n, left)) {
    throw new Error(`Illegal split of group ${group + 1} at ${left}`);
  }
  return [...groups.slice(0, group), left, n - left, ...groups.slice(group + 1)];
}

export function legalSplits(groups: Groups): Split[] {
  const out: Split[] = [];
  groups.forEach((n, group) => {
    for (let left = 1; left < n; left++) if (canSplit(n, left)) out.push({ group, left });
  });
  return out;
}

/** No group has 3 or more dots, so nobody can move. */
export function isGameOver(groups: Groups): boolean {
  return groups.every(n => n < MIN_DOTS);
}

/** Splits that leave a Balanced position. */
export function winningSplits(groups: Groups): Split[] {
  return legalSplits(groups).filter(m => isBalanced(groupValues(applySplit(groups, m))));
}

/** Perfect computer: balance the board if possible, otherwise any legal split. */
export function computerSplit(groups: Groups, random: () => number = Math.random): Split | null {
  const wins = winningSplits(groups);
  const pool = wins.length > 0 ? wins : legalSplits(groups);
  return pool.length > 0 ? pool[Math.floor(random() * pool.length)] : null;
}
