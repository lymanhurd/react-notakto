import { describe, it, expect } from 'vitest'
import {
  applySplit,
  canSplit,
  computerSplit,
  grundyValue,
  groupValues,
  isGameOver,
  legalSplits,
  winningSplits,
} from './logic'
import { isBalanced } from '../shared/balance'

describe("Grundy's Game values", () => {
  it('match the table on the original site (sizes 1–15)', () => {
    const table = [0, 0, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 3, 2, 1]
    expect(table.map((_, i) => grundyValue(i + 1))).toEqual(table)
  })

  it('match the published sequence further out (OEIS A002188)', () => {
    // sizes 16–24
    expect([16, 17, 18, 19, 20, 21, 22, 23, 24].map(grundyValue)).toEqual([3, 2, 4, 3, 0, 4, 3, 0, 4])
  })
})

describe('splits', () => {
  it('only allows unequal splits of groups of 3 or more', () => {
    expect(canSplit(5, 2)).toBe(true)
    expect(canSplit(4, 2)).toBe(false) // equal halves
    expect(canSplit(2, 1)).toBe(false)
    expect(canSplit(5, 0)).toBe(false)
    expect(canSplit(5, 5)).toBe(false)
  })

  it('splits in place, keeping the left piece on the left', () => {
    expect(applySplit([8, 3], { group: 0, left: 3 })).toEqual([3, 5, 3])
    expect(() => applySplit([4], { group: 0, left: 2 })).toThrow()
  })

  it('lists every legal split', () => {
    expect(legalSplits([5])).toEqual([
      { group: 0, left: 1 }, { group: 0, left: 2 }, { group: 0, left: 3 }, { group: 0, left: 4 },
    ])
    expect(legalSplits([1, 2, 2])).toEqual([])
  })

  it('ends when no group has 3 or more dots', () => {
    expect(isGameOver([1, 2, 1, 2])).toBe(true)
    expect(isGameOver([1, 3])).toBe(false)
  })
})

describe('strategy', () => {
  it('a single group of 7 or 10 is already balanced (value 0): no winning split', () => {
    expect(winningSplits([7])).toEqual([])
    expect(winningSplits([10])).toEqual([])
  })

  it('every winning split leaves a balanced board', () => {
    for (const groups of [[8], [5, 3], [9], [6, 4, 5]]) {
      const wins = winningSplits(groups)
      expect(wins.length).toBeGreaterThan(0)
      for (const m of wins) expect(isBalanced(groupValues(applySplit(groups, m)))).toBe(true)
    }
  })

  it('the computer balances when it can and returns null when no move exists', () => {
    const groups = [8]
    expect(isBalanced(groupValues(applySplit(groups, computerSplit(groups)!)))).toBe(true)
    expect(computerSplit([1, 2])).toBeNull()
  })
})
