import { describe, it, expect } from 'vitest'
import {
  applyMove,
  computerMove,
  destinations,
  isGameOver,
  legalMoves,
  pairs,
  piles,
  minSquares,
  randomCoins,
  winningMoves,
} from './logic'
import { isBalanced } from '../shared/balance'

/** Squares numbered from 1 at the star end, as in the write-ups. */
const at = (...squares: number[]) => squares.map(s => s - 1)

describe('piles (every other gap)', () => {
  it('odd number of coins: last gap runs to the star end (write-up, page 1)', () => {
    // Coins on squares 4, 6, 9: gaps 7–8 (2 squares) and 1–3 (3 squares).
    expect(piles(at(4, 6, 9))).toEqual([2, 3])
    expect(pairs(at(4, 6, 9))[1]).toEqual({ trailing: 3, leading: null, gap: 3 })
  })

  it('even number of coins: gaps between each silver and copper pair', () => {
    // Coins on squares 2, 4, 6, 9: gaps 7–8 (2) and 3 (1); gaps 1 and 5 don't count.
    expect(piles(at(2, 4, 6, 9))).toEqual([2, 1])
  })

  it('adjacent coins make an empty pile', () => {
    expect(piles(at(3, 4))).toEqual([0])
  })
})

describe('moves', () => {
  it('slides toward the star without jumping or landing on a coin', () => {
    expect(destinations(at(2, 5), 4)).toEqual([3, 2]) // squares 4 and 3
    expect(destinations(at(2, 5), 1)).toEqual([0])
    expect(destinations(at(1, 2), 1)).toEqual([]) // blocked
    expect(() => applyMove(at(2, 5), { from: 4, to: 1 })).toThrow() // would land on a coin
    expect(applyMove(at(2, 5), { from: 4, to: 2 })).toEqual(at(2, 3))
  })

  it('ends when every coin is packed against the star', () => {
    expect(isGameOver(at(1, 2, 3))).toBe(true)
    expect(isGameOver(at(1, 2, 4))).toBe(false)
    expect(legalMoves(at(1, 2, 3))).toEqual([])
  })
})

describe('strategy', () => {
  it('balanced positions have no winning move', () => {
    // piles [2, 2]
    expect(winningMoves(at(1, 4, 6, 9))).toEqual([])
  })

  it('every winning move balances the piles', () => {
    for (const coins of [at(4, 6, 9), at(2, 4, 6, 9), at(3, 7, 8, 12, 16)]) {
      const wins = winningMoves(coins)
      expect(wins.length).toBeGreaterThan(0)
      for (const m of wins) expect(isBalanced(piles(applyMove(coins, m)))).toBe(true)
    }
  })

  it('answers a leading (copper) move by moving its trailing partner the same distance', () => {
    const balanced = at(1, 4, 6, 9) // piles [2, 2]
    // Opponent slides the copper coin on square 6 to square 5 (gap 7–8 grows to 3).
    const after = applyMove(balanced, { from: 5, to: 4 })
    expect(winningMoves(after)).toContainEqual({ from: 8, to: 7 })
  })

  it('the computer balances when it can and returns null at the end', () => {
    const coins = at(4, 6, 9)
    expect(isBalanced(piles(applyMove(coins, computerMove(coins)!)))).toBe(true)
    expect(computerMove(at(1, 2))).toBeNull()
  })

  it('random arrangements are sorted, distinct and not already finished', () => {
    let seed = 1
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 50; i++) {
      const coins = randomCoins(5, 12, random)
      expect(new Set(coins).size).toBe(5)
      expect([...coins].sort((a, b) => a - b)).toEqual(coins)
      expect(coins.every(c => c >= 0 && c < 12)).toBe(true)
      expect(isGameOver(coins)).toBe(false)
    }
  })

  it('random arrangements leave a gap in front of every coin', () => {
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const count = 1 + (i % 8)
      const squares = minSquares(count) + (i % 5)
      const coins = randomCoins(count, squares, random)
      expect(coins).toHaveLength(count)
      expect(coins[0]).toBeGreaterThanOrEqual(1)
      expect(coins[count - 1]).toBeLessThan(squares)
      for (let k = 1; k < count; k++) expect(coins[k] - coins[k - 1]).toBeGreaterThanOrEqual(2)
      expect(piles(coins).every(g => g >= 1)).toBe(true)
      if (count === 2 && squares === 5) seen.add(coins.join(','))
    }
    // On 5 squares, 2 coins can sit at (1,3), (1,4) or (2,4): every one turns up.
    expect([...seen].sort()).toEqual(['1,3', '1,4', '2,4'])
  })

  it('fits the coins exactly when squares are tight', () => {
    expect(randomCoins(3, minSquares(3))).toEqual([1, 3, 5])
  })
})
