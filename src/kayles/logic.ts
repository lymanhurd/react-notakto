/**
 * Kayles: a row of pins. A move knocks down one pin, or two pins standing
 * side by side. Whoever knocks down the last pin wins.
 *
 * Each unbroken run of n standing pins acts like a Nim row whose size is
 * kaylesValue(n), so the winning strategy is the packet's: leave a Balanced
 * set of values.
 */
import { isBalanced, mex } from '../shared/balance';

/** true = standing, false = knocked down, in order along the row. */
export type Pins = boolean[];

export interface Knock {
  /** Index of the (left-hand) pin. */
  index: number;
  /** 1 pin, or 2 adjacent pins starting at `index`. */
  count: 1 | 2;
}

export const MIN_PINS = 1;
export const MAX_PINS = 24;

const values: number[] = [0];

/** Kayles value of a run of n pins: mex over knocking 1 or 2 pins anywhere in it. */
export function kaylesValue(n: number): number {
  for (let size = values.length; size <= n; size++) {
    const reachable: number[] = [];
    for (const take of [1, 2]) {
      for (let a = 0; a + take <= size; a++) reachable.push(values[a] ^ values[size - take - a]);
    }
    values[size] = mex(reachable);
  }
  return values[n];
}

export function newPins(n: number): Pins {
  return Array.from({ length: n }, () => true);
}

/** Lengths of the runs of standing pins, left to right. */
export function runs(pins: Pins): number[] {
  const out: number[] = [];
  let len = 0;
  for (const up of pins) {
    if (up) len++;
    else if (len > 0) {
      out.push(len);
      len = 0;
    }
  }
  if (len > 0) out.push(len);
  return out;
}

export function runValues(pins: Pins): number[] {
  return runs(pins).map(kaylesValue);
}

export function canKnock(pins: Pins, { index, count }: Knock): boolean {
  return pins[index] === true && (count === 1 || pins[index + 1] === true);
}

export function applyKnock(pins: Pins, knock: Knock): Pins {
  if (!canKnock(pins, knock)) {
    throw new Error(`Illegal move at pin ${knock.index + 1}`);
  }
  return pins.map((up, i) => up && !(i >= knock.index && i < knock.index + knock.count));
}

export function legalKnocks(pins: Pins): Knock[] {
  const out: Knock[] = [];
  pins.forEach((_, index) => {
    for (const count of [1, 2] as const) {
      if (canKnock(pins, { index, count })) out.push({ index, count });
    }
  });
  return out;
}

export function isGameOver(pins: Pins): boolean {
  return pins.every(up => !up);
}

/** Moves that leave a Balanced position. */
export function winningKnocks(pins: Pins): Knock[] {
  return legalKnocks(pins).filter(k => isBalanced(runValues(applyKnock(pins, k))));
}

/** Perfect computer: balance the board if possible, otherwise any legal move. */
export function computerKnock(pins: Pins, random: () => number = Math.random): Knock | null {
  const wins = winningKnocks(pins);
  const pool = wins.length > 0 ? wins : legalKnocks(pins);
  return pool.length > 0 ? pool[Math.floor(random() * pool.length)] : null;
}
