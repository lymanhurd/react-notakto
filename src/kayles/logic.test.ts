import { describe, it, expect } from 'vitest'
import {
  applyKnock,
  canKnock,
  computerKnock,
  isGameOver,
  kaylesValue,
  newPins,
  runs,
  runValues,
  winningKnocks,
} from './logic'
import { isBalanced } from '../shared/balance'

/** The rule from the original Kayles page: exceptions first, otherwise by size mod 12. */
const EXCEPTIONS: Record<number, number> = {
  0: 0, 3: 3, 6: 3, 9: 4, 11: 6, 15: 7, 18: 3, 21: 4, 22: 6, 28: 5, 34: 6, 39: 3, 57: 4, 70: 6,
}
const MOD12 = [4, 1, 2, 8, 1, 4, 7, 2, 1, 8, 2, 7]
const tableValue = (n: number) => EXCEPTIONS[n] ?? MOD12[n % 12]

describe('Kayles values', () => {
  it('match the tables on the original site for sizes 0–100', () => {
    for (let n = 0; n <= 100; n++) expect(kaylesValue(n), `size ${n}`).toBe(tableValue(n))
  })
})

const P = (s: string) => [...s].map(c => c === 'o') // 'o' = standing, '.' = down

describe('moves', () => {
  it('knocks one pin or two adjacent standing pins', () => {
    const pins = P('oo.oo')
    expect(canKnock(pins, { index: 0, count: 2 })).toBe(true)
    expect(canKnock(pins, { index: 1, count: 2 })).toBe(false) // gap after pin 2
    expect(canKnock(pins, { index: 2, count: 1 })).toBe(false) // already down
    expect(applyKnock(pins, { index: 3, count: 2 })).toEqual(P('oo...'))
  })

  it('splits the row into runs of standing pins', () => {
    expect(runs(P('ooo.o..oo'))).toEqual([3, 1, 2])
    expect(runs(P('...'))).toEqual([])
    expect(runs(newPins(4))).toEqual([4])
  })

  it('ends when every pin is down', () => {
    expect(isGameOver(P('...'))).toBe(true)
    expect(isGameOver(P('.o.'))).toBe(false)
  })
})

describe('strategy', () => {
  it('first player wins any single row by knocking the middle (symmetry)', () => {
    // Every n ≥ 1 has a nonzero value, so there is always a winning first move.
    for (let n = 1; n <= 24; n++) expect(winningKnocks(newPins(n)).length).toBeGreaterThan(0)
  })

  it('every winning move leaves a balanced board', () => {
    for (const pins of [P('ooooooo'), P('ooo.oooo'), P('oo.o.ooooo')]) {
      for (const k of winningKnocks(pins)) expect(isBalanced(runValues(applyKnock(pins, k)))).toBe(true)
    }
  })

  it('a balanced board has no winning move', () => {
    expect(winningKnocks(P('ooo.ooo'))).toEqual([])
  })

  it('the computer balances when it can and returns null at the end', () => {
    const pins = P('oooooo')
    expect(isBalanced(runValues(applyKnock(pins, computerKnock(pins)!)))).toBe(true)
    expect(computerKnock(P('..'))).toBeNull()
  })
})
