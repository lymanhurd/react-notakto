import { describe, it, expect } from 'vitest'
import {
  applyMove,
  computerMove,
  constructionSteps,
  describeMove,
  GRID,
  isLegal,
  isP,
  key,
  marksAfter,
  moves,
  pSquares,
  safePair,
  winningMoves,
} from './logic'

/** Brute force: P if no move reaches a P position. */
function bruteP(size: number): Set<string> {
  const p = new Set<string>()
  for (let s = 0; s < 2 * size; s++) {
    for (let a = 0; a < size; a++) {
      const b = s - a
      if (b < 0 || b >= size) continue
      if (!moves({ a, b }).some(q => p.has(key(q)))) p.add(key({ a, b }))
    }
  }
  return p
}

describe('Wythoff logic', () => {
  it('lists the safe pairs from the golden ratio', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(safePair)).toEqual([
      [0, 0], [1, 2], [3, 5], [4, 7], [6, 10], [8, 13], [9, 15],
    ])
  })

  it('matches a brute-force search over the whole grid', () => {
    const brute = bruteP(GRID)
    const formula = new Set(pSquares().map(key))
    expect(formula).toEqual(brute)
    for (let a = 0; a < GRID; a++) for (let b = 0; b < GRID; b++) {
      expect(isP({ a, b })).toBe(brute.has(key({ a, b })))
    }
  })

  it('is symmetric', () => {
    for (const p of pSquares()) expect(isP({ a: p.b, b: p.a })).toBe(true)
  })

  it('allows only left, down and down-left diagonal moves', () => {
    const from = { a: 5, b: 3 }
    expect(isLegal(from, { a: 2, b: 3 })).toBe(true)
    expect(isLegal(from, { a: 5, b: 0 })).toBe(true)
    expect(isLegal(from, { a: 3, b: 1 })).toBe(true)
    expect(isLegal(from, { a: 4, b: 1 })).toBe(false)
    expect(isLegal(from, { a: 5, b: 3 })).toBe(false)
    expect(isLegal(from, { a: 6, b: 3 })).toBe(false)
    expect(() => applyMove(from, { a: 4, b: 1 })).toThrow()
    expect(moves(from)).toHaveLength(5 + 3 + 3)
  })

  it('finds winning moves, and none from a P square', () => {
    expect(winningMoves({ a: 4, b: 2 })).toEqual([{ a: 1, b: 2 }])
    expect(winningMoves({ a: 7, b: 4 })).toEqual([])
    expect(winningMoves({ a: 7, b: 5 })).toEqual([{ a: 3, b: 5 }, { a: 7, b: 4 }, { a: 5, b: 3 }])
    expect(isP(computerMove({ a: 9, b: 9 })!)).toBe(true)
    expect(computerMove({ a: 0, b: 0 })).toBeNull()
  })

  it('describes moves as pile moves', () => {
    expect(describeMove({ a: 5, b: 3 }, { a: 3, b: 1 })).toBe('take 2 stones from both piles')
    expect(describeMove({ a: 5, b: 3 }, { a: 4, b: 3 })).toBe('take 1 stone from pile A')
    expect(describeMove({ a: 5, b: 3 }, { a: 5, b: 0 })).toBe('take 3 stones from pile B')
  })

  it('builds the P squares by the marking procedure, one per step', () => {
    const steps = constructionSteps()
    expect(steps.map(s => key(s.p))).toEqual(
      ['0,0', '2,1', '1,2', '5,3', '7,4', '3,5', '10,6', '4,7', '13,8', '15,9', '6,10', '8,13', '9,15'])
    const marks = marksAfter(steps, steps.length)
    expect(marks.size).toBe(GRID * GRID)
    for (const [k, m] of marks) {
      const [a, b] = k.split(',').map(Number)
      expect(m === 'P').toBe(isP({ a, b }))
    }
  })

  it('marks the row, column and diagonal of (0, 0) in the first step', () => {
    const [first] = constructionSteps()
    expect(first.newN).toHaveLength(3 * (GRID - 1))
  })
})
