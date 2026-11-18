import { describe, it, expect } from 'vitest'
import {
  applyMove,
  clusters,
  computerMove,
  isBalanced,
  isGameOver,
  oddSizes,
  parseRows,
  tally,
  winningMoves,
} from './logic'

/** Winning moves as [row number (1-based), stones taken] for readable assertions. */
const wins = (rows: number[]) => winningMoves(rows).map(m => [m.row + 1, m.take])

describe('clusters (greedy power-of-two grouping)', () => {
  it('matches the packet examples and Quick Check', () => {
    expect(clusters(5)).toEqual([4, 1])
    expect(clusters(10)).toEqual([8, 2])
    expect(clusters(6)).toEqual([4, 2])
    expect(clusters(12)).toEqual([8, 4])
    expect(clusters(13)).toEqual([8, 4, 1])
    expect(clusters(15)).toEqual([8, 4, 2, 1])
    expect(clusters(0)).toEqual([])
  })
})

describe('tally and balance', () => {
  it('tallies (2, 3, 4) as in the walkthrough', () => {
    const t = tally([2, 3, 4])
    expect(t.get(4)).toBe(1)
    expect(t.get(2)).toBe(2)
    expect(t.get(1)).toBe(1)
    expect(oddSizes([2, 3, 4])).toEqual([4, 1])
    expect(isBalanced([2, 3, 4])).toBe(false)
    expect(isBalanced([2, 3, 1])).toBe(true)
  })

  it('treats equal rows and empty boards as balanced', () => {
    expect(isBalanced([5, 5])).toBe(true)
    expect(isBalanced([2, 4, 6])).toBe(true)
    expect(isBalanced([0, 0, 0])).toBe(true)
  })
})

describe('winning moves (packet answer key)', () => {
  it('Warm-up: (4, 7) → take 3 from the 7-row', () => {
    expect(wins([4, 7])).toEqual([[2, 3]])
  })

  it('Walkthrough: (2, 3, 4) → take 3 from row 3', () => {
    expect(wins([2, 3, 4])).toEqual([[3, 3]])
  })

  it('Game 1: (3, 4, 5) → take 2 from row 1', () => {
    expect(wins([3, 4, 5])).toEqual([[1, 2]])
  })

  it('Game 2: (5, 6, 7) → take 4 from any row', () => {
    expect(wins([5, 6, 7])).toEqual([[1, 4], [2, 4], [3, 4]])
  })

  it('Game 3: (2, 4, 6) is already balanced, so there is no winning move', () => {
    expect(wins([2, 4, 6])).toEqual([])
  })

  it('Boss Challenge: (4, 6, 7) has three winning moves', () => {
    // The packet lists two; taking 5 from row 3 → (4, 6, 2) also balances.
    expect(wins([4, 6, 7])).toEqual([[1, 3], [2, 3], [3, 5]])
    expect(isBalanced([4, 6, 4])).toBe(false) // taking only 3 from row 3 fails
  })
})

describe('moves and the computer', () => {
  it('applies legal moves and rejects illegal ones', () => {
    expect(applyMove([3, 4, 5], { row: 0, take: 2 })).toEqual([1, 4, 5])
    expect(() => applyMove([3, 4, 5], { row: 0, take: 4 })).toThrow()
    expect(() => applyMove([3, 4, 5], { row: 0, take: 0 })).toThrow()
  })

  it('always balances an unbalanced board', () => {
    for (const rows of [[3, 4, 5], [4, 6, 7], [1, 2, 3, 4], [7], [9, 1, 7]]) {
      const move = computerMove(rows)!
      expect(isBalanced(applyMove(rows, move))).toBe(true)
    }
  })

  it('takes a single stone from a balanced board', () => {
    const move = computerMove([2, 4, 6], () => 0)!
    expect(move.take).toBe(1)
  })

  it('takes the last stone and ends the game', () => {
    const move = computerMove([0, 3, 0])!
    expect(move).toEqual({ row: 1, take: 3 })
    expect(isGameOver(applyMove([0, 3, 0], move))).toBe(true)
    expect(computerMove([0, 0])).toBeNull()
  })
})

describe('parseRows', () => {
  it('accepts friendly formats', () => {
    expect(parseRows('3, 4, 5')).toEqual([3, 4, 5])
    expect(parseRows('(4 6 7)')).toEqual([4, 6, 7])
  })

  it('rejects empty, zero, oversized or too many rows', () => {
    expect(parseRows('')).toBeNull()
    expect(parseRows('3, 0, 5')).toBeNull()
    expect(parseRows('16')).toBeNull()
    expect(parseRows('1 2 3 4 5 6 7')).toBeNull()
    expect(parseRows('a, b')).toBeNull()
  })
})
